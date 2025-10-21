"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const typeorm_1 = require("typeorm");
const ChatMessage_1 = require("../../database/entities/ChatMessage");
const Execution_1 = require("../../database/entities/Execution");
const internalFlowiseError_1 = require("../../errors/internalFlowiseError");
const utils_1 = require("../../errors/utils");
const utils_2 = require("../../utils");
const getRunningExpressApp_1 = require("../../utils/getRunningExpressApp");
const getExecutionById = async (executionId, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const executionRepository = appServer.AppDataSource.getRepository(Execution_1.Execution);
        const query = { id: executionId };
        // Add workspace filtering if provided
        if (workspaceId)
            query.workspaceId = workspaceId;
        const res = await executionRepository.findOne({ where: query });
        if (!res) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Execution ${executionId} not found`);
        }
        return res;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: executionsService.getExecutionById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getPublicExecutionById = async (executionId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const executionRepository = appServer.AppDataSource.getRepository(Execution_1.Execution);
        const res = await executionRepository.findOne({ where: { id: executionId, isPublic: true } });
        if (!res) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Execution ${executionId} not found`);
        }
        const executionData = typeof res?.executionData === 'string' ? JSON.parse(res?.executionData) : res?.executionData;
        const executionDataWithoutCredentialId = executionData.map((data) => (0, utils_2._removeCredentialId)(data));
        const stringifiedExecutionData = JSON.stringify(executionDataWithoutCredentialId);
        return { ...res, executionData: stringifiedExecutionData };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: executionsService.getPublicExecutionById - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const getAllExecutions = async (filters = {}) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const { id, agentflowId, agentflowName, sessionId, state, startDate, endDate, page = 1, limit = 12, workspaceId } = filters;
        // Handle UUID fields properly using raw parameters to avoid type conversion issues
        // This uses the query builder instead of direct objects for compatibility with UUID fields
        const queryBuilder = appServer.AppDataSource.getRepository(Execution_1.Execution)
            .createQueryBuilder('execution')
            .leftJoinAndSelect('execution.agentflow', 'agentflow')
            .orderBy('execution.updatedDate', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);
        if (id)
            queryBuilder.andWhere('execution.id = :id', { id });
        if (agentflowId)
            queryBuilder.andWhere('execution.agentflowId = :agentflowId', { agentflowId });
        if (agentflowName)
            queryBuilder.andWhere('LOWER(agentflow.name) LIKE LOWER(:agentflowName)', { agentflowName: `%${agentflowName}%` });
        if (sessionId)
            queryBuilder.andWhere('execution.sessionId = :sessionId', { sessionId });
        if (state)
            queryBuilder.andWhere('execution.state = :state', { state });
        if (workspaceId)
            queryBuilder.andWhere('execution.workspaceId = :workspaceId', { workspaceId });
        // Date range conditions
        if (startDate && endDate) {
            queryBuilder.andWhere('execution.createdDate BETWEEN :startDate AND :endDate', { startDate, endDate });
        }
        else if (startDate) {
            queryBuilder.andWhere('execution.createdDate >= :startDate', { startDate });
        }
        else if (endDate) {
            queryBuilder.andWhere('execution.createdDate <= :endDate', { endDate });
        }
        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: executionsService.getAllExecutions - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
const updateExecution = async (executionId, data, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const query = { id: executionId };
        // Add workspace filtering if provided
        if (workspaceId)
            query.workspaceId = workspaceId;
        const execution = await appServer.AppDataSource.getRepository(Execution_1.Execution).findOneBy(query);
        if (!execution) {
            throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.NOT_FOUND, `Execution ${executionId} not found`);
        }
        const updateExecution = new Execution_1.Execution();
        Object.assign(updateExecution, data);
        await appServer.AppDataSource.getRepository(Execution_1.Execution).merge(execution, updateExecution);
        const dbResponse = await appServer.AppDataSource.getRepository(Execution_1.Execution).save(execution);
        return dbResponse;
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: executionsService.updateExecution - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
/**
 * Delete multiple executions by their IDs
 * @param executionIds Array of execution IDs to delete
 * @param workspaceId Optional workspace ID to filter executions
 * @returns Object with success status and count of deleted executions
 */
const deleteExecutions = async (executionIds, workspaceId) => {
    try {
        const appServer = (0, getRunningExpressApp_1.getRunningExpressApp)();
        const executionRepository = appServer.AppDataSource.getRepository(Execution_1.Execution);
        // Create the where condition with workspace filtering if provided
        const whereCondition = { id: (0, typeorm_1.In)(executionIds) };
        if (workspaceId)
            whereCondition.workspaceId = workspaceId;
        // Delete executions where id is in the provided array and belongs to the workspace
        const result = await executionRepository.delete(whereCondition);
        // Update chat message executionId column to NULL
        await appServer.AppDataSource.getRepository(ChatMessage_1.ChatMessage).update({ executionId: (0, typeorm_1.In)(executionIds) }, { executionId: null });
        return {
            success: true,
            deletedCount: result.affected || 0
        };
    }
    catch (error) {
        throw new internalFlowiseError_1.InternalFlowiseError(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Error: executionsService.deleteExecutions - ${(0, utils_1.getErrorMessage)(error)}`);
    }
};
exports.default = {
    getExecutionById,
    getAllExecutions,
    deleteExecutions,
    getPublicExecutionById,
    updateExecution
};
//# sourceMappingURL=index.js.map