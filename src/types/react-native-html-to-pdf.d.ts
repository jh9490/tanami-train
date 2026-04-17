declare module 'react-native-html-to-pdf' {
  export interface PDFOptions {
    html: string;
    fileName?: string;
    base64?: boolean;
    directory?: string;
    bgColor?: string;
  }

  export interface PDFResult {
    filePath?: string;
    base64?: string;
  }

  export function generatePDF(options: PDFOptions): Promise<PDFResult>;
}
