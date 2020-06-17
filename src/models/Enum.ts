export interface EnumValue {
    label?: string;
    code?: string;
    value?: unknown;
}

export interface EnumType {
    name?: string;
    values?: EnumValue[];
}