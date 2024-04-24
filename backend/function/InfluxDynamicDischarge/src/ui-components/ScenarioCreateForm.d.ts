/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextAreaFieldProps, TextFieldProps } from "@aws-amplify/ui-react";
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
export declare type ScenarioCreateFormInputValues = {
    Name?: string;
    Settings?: string;
};
export declare type ScenarioCreateFormValidationValues = {
    Name?: ValidationFunction<string>;
    Settings?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ScenarioCreateFormOverridesProps = {
    ScenarioCreateFormGrid?: PrimitiveOverrideProps<GridProps>;
    Name?: PrimitiveOverrideProps<TextFieldProps>;
    Settings?: PrimitiveOverrideProps<TextAreaFieldProps>;
} & EscapeHatchProps;
export declare type ScenarioCreateFormProps = React.PropsWithChildren<{
    overrides?: ScenarioCreateFormOverridesProps | undefined | null;
} & {
    clearOnSuccess?: boolean;
    onSubmit?: (fields: ScenarioCreateFormInputValues) => ScenarioCreateFormInputValues;
    onSuccess?: (fields: ScenarioCreateFormInputValues) => void;
    onError?: (fields: ScenarioCreateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ScenarioCreateFormInputValues) => ScenarioCreateFormInputValues;
    onValidate?: ScenarioCreateFormValidationValues;
} & React.CSSProperties>;
export default function ScenarioCreateForm(props: ScenarioCreateFormProps): React.ReactElement;
