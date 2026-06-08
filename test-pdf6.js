import { PDFParse } from 'pdf-parse';
const instance = new PDFParse();
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
