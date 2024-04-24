/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
export declare type EscapeHatchProps = {
    [elementHierarchy: string]: Record<string, unknown>;
} | null;
export declare type VariantValues = {
    [key: string]: string;
};
export declare type Variant = {
    variantValues: VariantValues;
    overrides: EscapeHatchProps;
};
export declare type ValidationResponse = {
    hasError: boolean;
    errorMessage?: string;
};
export declare type ValidationFunction<T> = (value: T, validationResponse: ValidationResponse) => ValidationResponse | Promise<ValidationResponse>;
export declare type ScenarioLibraryCreateFormInputValues = {
    user_id?: string;
};
export declare type ScenarioLibraryCreateFormValidationValues = {
    user_id?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ScenarioLibraryCreateFormOverridesProps = {
    ScenarioLibraryCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    user_id?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type ScenarioLibraryCreateFormProps = React.PropsWithChildren<{
    overrides?: ScenarioLibraryCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: ScenarioLibraryCreateFormInputValues) => ScenarioLibraryCreateFormInputValues;
    onSuccess?: (fields: ScenarioLibraryCreateFormInputValues) => void;
    onError?: (fields: ScenarioLibraryCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ScenarioLibraryCreateFormInputValues) => ScenarioLibraryCreateFormInputValues;
    onValidate?: ScenarioLibraryCreateFormValidationValues;
} & React.CSSProperties>;
export default function ScenarioLibraryCreateForm(props: ScenarioLibraryCreateFormProps): React.ReactElement;
