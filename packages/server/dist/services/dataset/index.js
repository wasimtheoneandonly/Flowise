"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const Dataset_1 = require("../../database/entities/Dataset");
const DatasetRow_1 = require("../../database/entities/DatasetRow");
const stream_1 = require("stream");
const typeorm_1 = require("typeorm");
const csv_parser_1 = __importDefault(require("csv-parser"));
const getAllDatasets = async (workspaceId, page = -1, limit = -1) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const queryBuilder = appServer.AppDataSource.getRepository(Dataset_1.Dataset).createQueryBuilder('ds').orderBy('ds.updatedDate', 'DESC');
        if (page > 0 && limit > 0) {
            queryBuilder.skip((page - 1) * limit);
            queryBuilder.take(limit);
        }
        if (workspaceId)
            queryBuilder.andWhere('ds.workspaceId = :workspaceId', { workspaceId });
        const [data, total] = await queryBuilder.getManyAndCount();
        const returnObj = [];
        // TODO: This is a hack to get the row count for each dataset. Need to find a better way to do this
        for (const dataset of data) {
            ;
            dataset.rowCount = await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).count({
                where: { datasetId: dataset.id }
            });
            returnObj.push(dataset);
        }
        if (page > 0 && limit > 0) {
            return { total, data: returnObj };
        }
        else {
            return returnObj;
        }
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.getAllDatasets - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getDataset = async (id, page = -1, limit = -1) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dataset = await appServer.AppDataSource.getRepository(Dataset_1.Dataset).findOneBy({
            id: id
        });
        const queryBuilder = appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).createQueryBuilder('dsr').orderBy('dsr.sequenceNo', 'ASC');
        queryBuilder.andWhere('dsr.datasetId = :datasetId', { datasetId: id });
        if (page > 0 && limit > 0) {
            queryBuilder.skip((page - 1) * limit);
            queryBuilder.take(limit);
        }
        let [data, total] = await queryBuilder.getManyAndCount();
        // special case for sequence numbers == -1 (this happens when the update script is run and all rows are set to -1)
        // check if there are any sequence numbers == -1, if so set them to the max sequence number + 1
        const missingSequenceNumbers = data.filter((item) => item.sequenceNo === -1);
        if (missingSequenceNumbers.length > 0) {
            const maxSequenceNumber = data.reduce((prev, current) => (prev.sequenceNo > current.sequenceNo ? prev : current));
            let sequenceNo = maxSequenceNumber.sequenceNo + 1;
            for (const zeroSequenceNumber of missingSequenceNumbers) {
                zeroSequenceNumber.sequenceNo = sequenceNo++;
            }
            await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).save(missingSequenceNumbers);
            // now get the items again
            const queryBuilder2 = appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow)
                .createQueryBuilder('dsr')
                .orderBy('dsr.sequenceNo', 'ASC');
            queryBuilder2.andWhere('dsr.datasetId = :datasetId', { datasetId: id });
            if (page > 0 && limit > 0) {
                queryBuilder2.skip((page - 1) * limit);
                queryBuilder2.take(limit);
            }
            ;
            [data, total] = await queryBuilder2.getManyAndCount();
        }
        return {
            ...dataset,
            rows: data,
            total
        };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.getDataset - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const reorderDatasetRow = async (datasetId, rows) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        await appServer.AppDataSource.transaction(async (entityManager) => {
            // rows are an array of { id: string, sequenceNo: number }
            // update the sequence numbers in the DB
            for (const row of rows) {
                const item = await entityManager.getRepository(DatasetRow_1.DatasetRow).findOneBy({
                    id: row.id
                });
                if (!item)
                    throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Dataset Row ${row.id} not found`);
                item.sequenceNo = row.sequenceNo;
                await entityManager.getRepository(DatasetRow_1.DatasetRow).save(item);
            }
            await changeUpdateOnDataset(datasetId, entityManager);
        });
        return { message: 'Dataset row reordered successfully' };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.reorderDatasetRow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const _readCSV = async (stream, results) => {
    return new Promise((resolve, reject) => {
        stream
            .pipe((0, csv_parser_1.default)({
            headers: false
        }))
            .on('data', (data) => results.push(data))
            .on('end', () => {
            resolve(results);
        })
            .on('error', reject);
    });
};
const _csvToDatasetRows = async (datasetId, csvString, firstRowHeaders) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        // get the max value first
        const maxValueEntity = await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).find({
            order: {
                sequenceNo: 'DESC'
            },
            take: 1
        });
        let sequenceNo = 0;
        if (maxValueEntity && maxValueEntity.length > 0) {
            sequenceNo = maxValueEntity[0].sequenceNo;
        }
        sequenceNo++;
        // Array to hold parsed records
        const results = [];
        let files = [];
        if (csvString.startsWith('[') && csvString.endsWith(']')) {
            files = JSON.parse(csvString);
        }
        else {
            files = [csvString];
        }
        for (const file of files) {
            const splitDataURI = file.split(',');
            splitDataURI.pop();
            const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
            const csvString = bf.toString('utf8');
            // Convert CSV string to a Readable stream
            const stream = stream_1.Readable.from(csvString);
            const rows = [];
            await _readCSV(stream, rows);
            results.push(...rows);
        }
        if (results && results?.length > 0) {
            for (let r = 0; r < results.length; r++) {
                const row = results[r];
                let input = '';
                let output = '';
                if (firstRowHeaders && r === 0) {
                    continue;
                }
                input = row['0'];
                output = row['1'];
                const newRow = appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).create(new DatasetRow_1.DatasetRow());
                newRow.datasetId = datasetId;
                newRow.input = input;
                newRow.output = output;
                newRow.sequenceNo = sequenceNo;
                await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).save(newRow);
                sequenceNo++;
            }
        }
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService._csvToDatasetRows - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Create new dataset
const createDataset = async (body) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const newDs = new Dataset_1.Dataset();
        Object.assign(newDs, body);
        const dataset = appServer.AppDataSource.getRepository(Dataset_1.Dataset).create(newDs);
        const result = await appServer.AppDataSource.getRepository(Dataset_1.Dataset).save(dataset);
        if (body.csvFile) {
            await _csvToDatasetRows(result.id, body.csvFile, body.firstRowHeaders);
        }
        return result;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.createDataset - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Update dataset
const updateDataset = async (id, body) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const dataset = await appServer.AppDataSource.getRepository(Dataset_1.Dataset).findOneBy({
            id: id
        });
        if (!dataset)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Dataset ${id} not found`);
        const updateDataset = new Dataset_1.Dataset();
        Object.assign(updateDataset, body);
        appServer.AppDataSource.getRepository(Dataset_1.Dataset).merge(dataset, updateDataset);
        const result = await appServer.AppDataSource.getRepository(Dataset_1.Dataset).save(dataset);
        return result;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.updateDataset - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Delete dataset via id
const deleteDataset = async (id) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const result = await appServer.AppDataSource.getRepository(Dataset_1.Dataset).delete({ id: id });
        // delete all rows for this dataset
        await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).delete({ datasetId: id });
        return result;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.deleteDataset - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Create new row in a given dataset
const addDatasetRow = async (body) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        if (body.csvFile) {
            await _csvToDatasetRows(body.datasetId, body.csvFile, body.firstRowHeaders);
            await changeUpdateOnDataset(body.datasetId);
            return { message: 'Dataset rows added successfully' };
        }
        else {
            // get the max value first
            const maxValueEntity = await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).find({
                where: {
                    datasetId: body.datasetId
                },
                order: {
                    sequenceNo: 'DESC'
                },
                take: 1
            });
            let sequenceNo = 0;
            if (maxValueEntity && maxValueEntity.length > 0) {
                sequenceNo = maxValueEntity[0].sequenceNo;
            }
            const newDs = new DatasetRow_1.DatasetRow();
            Object.assign(newDs, body);
            newDs.sequenceNo = sequenceNo === 0 ? sequenceNo : sequenceNo + 1;
            const row = appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).create(newDs);
            const result = await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).save(row);
            await changeUpdateOnDataset(body.datasetId);
            return result;
        }
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.createDatasetRow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const changeUpdateOnDataset = async (id, entityManager) => {
    const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
    const dataset = await appServer.AppDataSource.getRepository(Dataset_1.Dataset).findOneBy({
        id: id
    });
    if (!dataset)
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Dataset ${id} not found`);
    dataset.updatedDate = new Date();
    if (entityManager) {
        await entityManager.getRepository(Dataset_1.Dataset).save(dataset);
    }
    else {
        await appServer.AppDataSource.getRepository(Dataset_1.Dataset).save(dataset);
    }
};
// Update row for a dataset
const updateDatasetRow = async (id, body) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const item = await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).findOneBy({
            id: id
        });
        if (!item)
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Dataset Row ${id} not found`);
        const updateItem = new DatasetRow_1.DatasetRow();
        Object.assign(updateItem, body);
        appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).merge(item, updateItem);
        const result = await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).save(item);
        await changeUpdateOnDataset(body.datasetId);
        return result;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.updateDatasetRow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Delete dataset row via id
const deleteDatasetRow = async (id) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        return await appServer.AppDataSource.transaction(async (entityManager) => {
            const item = await entityManager.getRepository(DatasetRow_1.DatasetRow).findOneBy({
                id: id
            });
            if (!item)
                throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Dataset Row ${id} not found`);
            const result = await entityManager.getRepository(DatasetRow_1.DatasetRow).delete({ id: id });
            await changeUpdateOnDataset(item.datasetId, entityManager);
            return result;
        });
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.deleteDatasetRow - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
// Delete dataset rows via ids
const patchDeleteRows = async (ids = []) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const datasetItemsToBeDeleted = await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).find({
            where: {
                id: (0, typeorm_1.In)(ids)
            }
        });
        const dbResponse = await appServer.AppDataSource.getRepository(DatasetRow_1.DatasetRow).delete(ids);
        const datasetIds = [...new Set(datasetItemsToBeDeleted.map((item) => item.datasetId))];
        for (const datasetId of datasetIds) {
            await changeUpdateOnDataset(datasetId);
        }
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: datasetService.patchDeleteRows - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getAllDatasets,
    getDataset,
    createDataset,
    updateDataset,
    deleteDataset,
    addDatasetRow,
    updateDatasetRow,
    deleteDatasetRow,
    patchDeleteRows,
    reorderDatasetRow
};
//# sourceMappingURL=index.js.map