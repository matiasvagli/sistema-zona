import simpleRestDataProvider from "@refinedev/simple-rest";
import { axiosInstance } from "../utils/axios-instance";
import { DataProvider } from "@refinedev/core";

const API_URL = "http://localhost:8000/api/v1";

const baseDataProvider = simpleRestDataProvider(API_URL, axiosInstance);

export const dataProvider: DataProvider = {
    ...baseDataProvider,
    create: async ({ resource, variables, meta }) => {
        return baseDataProvider.create({
            resource: `${resource}/`,
            variables,
            meta,
        });
    },
    update: async ({ resource, id, variables, meta }) => {
        // Para update, simple-rest concatena url/id. 
        // Si mandamos resource/ con slash, queda resource//id.
        // Django acepta resource/id/ (con slash al final).
        // Vamos a usar una ruta custom o simplemente no agregar el slash aquí 
        // si el baseDataProvider ya lo maneja.
        return baseDataProvider.update({
            resource, // Volvemos al original para evitar el doble slash
            id,
            variables,
            meta,
        });
    },
    getOne: async ({ resource, id, meta }) => {
        return baseDataProvider.getOne({
            resource,
            id,
            meta,
        });
    },
    deleteOne: async ({ resource, id, variables, meta }) => {
        return baseDataProvider.deleteOne({
            resource,
            id,
            variables,
            meta,
        });
    },
    getList: async ({ resource, pagination, filters, sorters, meta }) => {
        const response = await baseDataProvider.getList({
            resource: `${resource}/`,
            pagination,
            filters,
            sorters,
            meta,
        });

        if (response.data && (response.data as any).results) {
            return {
                data: (response.data as any).results,
                total: (response.data as any).count || response.total,
            };
        }

        return response;
    },
};
