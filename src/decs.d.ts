declare module '@sorioinc/react-file-viewer';
declare module 'canvas-datagrid';
declare module 'comma-separated-values';
declare module 'get-browser-fingerprint';
declare module 'react-file-type-icons';
declare module 'uint8-to-base64';
declare module '@fluentui/react'

type Styles = Record<string, string>;

declare module '*.svg' {
    const content: React.FunctionComponent<React.SVGAttributes<SVGElement>>;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.scss' {
    const content: Styles;
    export default content;
}

declare module '*.sass' {
    const content: Styles;
    export default content;
}

declare module '*.css' {
    const content: Styles;
    export default content;
}
