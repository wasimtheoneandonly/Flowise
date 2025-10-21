"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const { NimContainerManager } = require('flowise-nim-container-manager');
const getToken = async (req, res, next) => {
    try {
        const headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        };
        const data = {
            client_id: 'Flowise',
            pdi: '0x1234567890abcdeg',
            access_policy_name: 'nim-dev'
        };
        const response = await axios_1.default.post('https://nts.ngc.nvidia.com/v1/token', data, { headers });
        const responseJson = response.data;
        return res.json(responseJson);
    }
    catch (error) {
        next(error);
    }
};
const preload = async (req, res, next) => {
    try {
        await NimContainerManager.preload();
        return res.send('Preloaded NIM');
    }
    catch (error) {
        next(error);
    }
};
const downloadInstaller = async (req, res, next) => {
    try {
        await NimContainerManager.downloadInstaller();
        return res.send('NIM Installer completed successfully!');
    }
    catch (error) {
        next(error);
    }
};
const pullImage = async (req, res, next) => {
    try {
        const imageTag = req.body.imageTag;
        const apiKey = req.body.apiKey;
        await NimContainerManager.pullImage(imageTag, apiKey);
        return res.send(`Pulling image ${imageTag}`);
    }
    catch (error) {
        next(error);
    }
};
const startContainer = async (req, res, next) => {
    try {
        const imageTag = req.body.imageTag;
        const apiKey = req.body.apiKey;
        const hostPort = req.body.hostPort;
        const nimRelaxMemConstraints = parseInt(req.body.nimRelaxMemConstraints);
        // Validate nimRelaxMemConstraints
        if (isNaN(nimRelaxMemConstraints) || (nimRelaxMemConstraints !== 0 && nimRelaxMemConstraints !== 1)) {
            return res.status(400).send('nimRelaxMemConstraints must be 0 or 1');
        }
        await NimContainerManager.startContainer(imageTag, apiKey, hostPort, nimRelaxMemConstraints);
        return res.send(`Starting container ${imageTag}`);
    }
    catch (error) {
        next(error);
    }
};
const getImage = async (req, res, next) => {
    try {
        const imageTag = req.body.imageTag;
        const images = await NimContainerManager.userImageLibrary();
        const image = images.find((img) => img.tag === imageTag);
        if (!image) {
            return res.status(404).send(`Image ${imageTag} not found`);
        }
        return res.json(image);
    }
    catch (error) {
        next(error);
    }
};
const getContainer = async (req, res, next) => {
    try {
        const imageTag = req.body.imageTag;
        const port = req.body.port;
        // First check if the image exists
        const images = await NimContainerManager.userImageLibrary();
        const image = images.find((img) => img.tag === imageTag);
        if (!image) {
            return res.status(404).send(`Image ${imageTag} not found`);
        }
        const containers = await NimContainerManager.listRunningContainers();
        const portInUse = containers.find((cont) => cont.port === port);
        if (portInUse) {
            const isModelContainer = portInUse.image === image.tag;
            if (isModelContainer) {
                portInUse.image = image.name;
                return res.json(portInUse);
            }
            else {
                return res.status(409).send({
                    message: `Port ${port} is already in use by another container`,
                    container: portInUse
                });
            }
        }
        // If no container found with matching port, return 404
        return res.status(404).send(`Container of ${imageTag} with port ${port} not found`);
    }
    catch (error) {
        next(error);
    }
};
const listRunningContainers = async (req, res, next) => {
    try {
        const containers = await NimContainerManager.listRunningContainers();
        return res.json(containers);
    }
    catch (error) {
        next(error);
    }
};
const stopContainer = async (req, res, next) => {
    try {
        const containerId = req.body.containerId;
        const containerInfo = await NimContainerManager.stopContainer(containerId);
        return res.json(containerInfo);
    }
    catch (error) {
        next(error);
    }
};
exports.default = {
    preload,
    getToken,
    downloadInstaller,
    pullImage,
    startContainer,
    getImage,
    getContainer,
    listRunningContainers,
    stopContainer
};
//# sourceMappingURL=index.js.map