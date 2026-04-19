import simpleRestDataProvider from "@refinedev/simple-rest";
import { axiosInstance } from "../utils/axios-instance";
import { DataProvider } from "@refinedev/core";

const API_URL = "http://localhost:8000/api/v1";

const baseDataProvider = simpleRestDataProvider(API_URL, axiosInstance);

export const dataProvider: DataProvider = {
    ...baseDataProvider,
    getList: async ({ resource, pagination, filters, sorters, meta }) => {
        const response = await baseDataProvider.getList({
            resource,
            pagination,
            filters,
            sorters,
            meta,
        });

        // DRF envuelve los resultados en 'results' si hay paginación
        // simple-rest intenta devolver la data directamente.
        // Si la data tiene 'results', la extraemos.
        if (response.data && (response.data as any).results) {
            return {
                data: (response.data as any).results,
                total: (response.data as any).count || response.total,
            };
        }

        return response;
    },
};
