"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonRepository = void 0;
const file_storage_1 = require("../utils/file-storage");
const logger_1 = require("../utils/logger");
/**
 * JSON file-based repository implementation
 * Maintains in-memory Map for fast access and persists to JSON files
 */
class JsonRepository {
    /**
     * @param entityFilePath Path to the entity JSON file (e.g., 'db/activities.json')
     * @param seedFilePath Optional path to seed data file (e.g., 'db/seed/activities.json')
     */
    constructor(entityFilePath, seedFilePath) {
        this.entities = new Map();
        this.nextId = 1;
        this.entityFilePath = entityFilePath;
        this.seedFilePath = seedFilePath;
    }
    /**
     * Loads data from seed file and persisted file, merging them
     * Persisted data takes precedence over seed data
     */
    load() {
        // Load seed data first
        let seedData = [];
        if (this.seedFilePath) {
            const seed = (0, file_storage_1.readJsonFile)(this.seedFilePath);
            if (seed && Array.isArray(seed)) {
                seedData = seed;
                logger_1.logger.info('JsonRepository', `Loaded ${seedData.length} entities from seed: ${this.seedFilePath}`);
            }
        }
        // Load persisted data
        let persistedData = [];
        const persisted = (0, file_storage_1.readJsonFile)(this.entityFilePath);
        if (persisted && Array.isArray(persisted)) {
            persistedData = persisted;
            logger_1.logger.info('JsonRepository', `Loaded ${persistedData.length} entities from: ${this.entityFilePath}`);
        }
        // Merge: persisted data takes precedence
        const mergedMap = new Map();
        // First add seed data
        for (const entity of seedData) {
            if (entity.id) {
                mergedMap.set(entity.id, entity);
            }
        }
        // Then override with persisted data
        for (const entity of persistedData) {
            if (entity.id) {
                mergedMap.set(entity.id, entity);
            }
        }
        // Update in-memory Map
        this.entities = mergedMap;
        // Calculate next ID from existing entities
        this.calculateNextId();
        logger_1.logger.info('JsonRepository', `Loaded ${this.entities.size} total entities for: ${this.entityFilePath}`);
    }
    /**
     * Saves current in-memory state to JSON file
     */
    save() {
        try {
            const entitiesArray = Array.from(this.entities.values());
            (0, file_storage_1.writeJsonFile)(this.entityFilePath, entitiesArray);
            logger_1.logger.info('JsonRepository', `Saved ${entitiesArray.length} entities to: ${this.entityFilePath}`);
        }
        catch (error) {
            logger_1.logger.error('JsonRepository', `Failed to save entities to: ${this.entityFilePath}`, error);
            // Don't throw - allow operation to continue with in-memory data
        }
    }
    /**
     * Gets all entities
     */
    getAll() {
        return Array.from(this.entities.values());
    }
    /**
     * Gets an entity by ID
     */
    getById(id) {
        return this.entities.get(id);
    }
    /**
     * Creates a new entity and persists it
     */
    create(entity) {
        this.entities.set(entity.id, entity);
        this.save();
        return entity;
    }
    /**
     * Updates an existing entity and persists changes
     */
    update(id, updates) {
        const existing = this.entities.get(id);
        if (!existing) {
            return undefined;
        }
        const updated = { ...existing, ...updates };
        this.entities.set(id, updated);
        this.save();
        return updated;
    }
    /**
     * Deletes an entity and persists changes
     */
    delete(id) {
        const deleted = this.entities.delete(id);
        if (deleted) {
            this.save();
        }
        return deleted;
    }
    /**
     * Calculates the next ID based on existing entity IDs
     * Assumes IDs follow pattern: resource-{number}
     */
    calculateNextId() {
        let maxId = 0;
        for (const id of this.entities.keys()) {
            const match = id.match(/-(\d+)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxId) {
                    maxId = num;
                }
            }
        }
        this.nextId = maxId + 1;
    }
    /**
     * Gets the next ID (for services that need to generate IDs)
     */
    getNextId() {
        return this.nextId++;
    }
}
exports.JsonRepository = JsonRepository;
