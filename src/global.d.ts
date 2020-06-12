interface TextStrings {
    name: string;
    value: string;
}
interface TextChars {
    code: number;
    value: string;
}
interface TextUnicodes {
    code: string;
    value: string;
}
interface TranslateObject {
    success: boolean;
    mathml?: string;
    generated?: {
        text: string | string[];
        svg?: string;
        html?: string;
        ascii: string;
    };
    attributes?: {
        language: string;
        display: string;
        image: string;
    };
    uuid: string;
    error?: Error;
}