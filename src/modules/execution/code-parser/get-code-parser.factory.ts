import { Injectable } from '@nestjs/common';
import { CodeParser } from './code-parser.interface';
import { JavaScriptParser } from './parsers/java-script.parser';
import { languages } from 'generated/prisma/enums';

@Injectable()
export class GetCodeParserFactory {
    constructor(private javaScriptParser: JavaScriptParser) {}
    getCodeParser(language: languages): CodeParser {
        switch (language) {
            case languages.JavaScript: {
                return this.javaScriptParser;
            }
            default: {
                return this.javaScriptParser;
            }
        }
    }
}
