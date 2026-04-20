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
        // Django requiere slash al final para peticiones PATCH/PUT
        const { data } = await axiosInstance.patch(`${API_URL}/${resource}/${id}/`, variables);
        return { data };
    },
    getOne: async ({ resource, id, meta }) => {
        return baseDataProvider.getOne({
            resource,
            id: `${id}/`,
            meta,
        });
    },
    deleteOne: async ({ resource, id, variables, meta }) => {
        // Django requiere slash al final para peticiones DELETE
        const { data } = await axiosInstance.delete(`${API_URL}/${resource}/${id}/`, {
            data: variables
        });
        return { data };
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
