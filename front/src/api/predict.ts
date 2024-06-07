import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useApi } from ".";
import { AxiosError, AxiosResponse } from "axios";
import { toast } from "sonner";

const useGetPrediction = () => {
    const { api } = useApi();

    var queryOptions: UseQueryOptions<any,
        Error,
        any,
        any> = {
        queryKey: ["predicts"],
        queryFn: (image: any) => {
            const formData = new FormData();
            formData.append('image', image);
            // console.log(image)
            // console.log(formData)

            api.post("predict", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
        },
        staleTime: 600000,
    };
    const context = useQuery(queryOptions)
    return { ...context, data: context.data?.data };
};

const useMutatePredict = () => {
    const { api } = useApi()

    var mutationOptions: UseMutationOptions<any, any, any, any> = {
        mutationFn: (data: any) => {
            console.log(data)
            const formData = new FormData();
            formData.append('image', data.blob);
            return api.post("predict", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
        }
    };
    return useMutation(mutationOptions)
}
export const PredictionService = {
    useGetPrediction,
    useMutatePredict
};