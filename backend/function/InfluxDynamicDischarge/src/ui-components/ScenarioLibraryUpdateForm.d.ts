/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

import * as React from "react";
import { GridProps, TextFieldProps } from "@aws-amplify/ui-react";
import { ScenarioLibrary } from "../models";
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
export declare type ScenarioLibraryUpdateFormInputValues = {
    user_id?: string;
};
export declare type ScenarioLibraryUpdateFormValidationValues = {
    user_id?: ValidationFunction<string>;
};
export declare type PrimitiveOverrideProps<T> = Partial<T> & React.DOMAttributes<HTMLDivElement>;
export declare type ScenarioLibraryUpdateFormOverridesProps = {
    ScenarioLibraryUpdateFormGrid?: PrimitiveOverrideProps<GridProps>;
    user_id?: PrimitiveOverrideProps<TextFieldProps>;
} & EscapeHatchProps;
export declare type ScenarioLibraryUpdateFormProps = React.PropsWithChildren<{
    overrides?: ScenarioLibraryUpdateFormOverridesProps | undefined | null;
} & {
    id?: string;
    scenarioLibrary?: ScenarioLibrary;
    onSubmit?: (fields: ScenarioLibraryUpdateFormInputValues) => ScenarioLibraryUpdateFormInputValues;
    onSuccess?: (fields: ScenarioLibraryUpdateFormInputValues) => void;
    onError?: (fields: ScenarioLibraryUpdateFormInputValues, errorMessage: string) => void;
    onChange?: (fields: ScenarioLibraryUpdateFormInputValues) => ScenarioLibraryUpdateFormInputValues;
    onValidate?: ScenarioLibraryUpdateFormValidationValues;
} & React.CSSProperties>;
export default function ScenarioLibraryUpdateForm(props: ScenarioLibraryUpdateFormProps): React.ReactElement;
