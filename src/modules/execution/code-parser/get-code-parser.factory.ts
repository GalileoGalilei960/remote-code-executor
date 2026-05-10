import { Injectable } from '@nestjs/common';
import { CodeParser } from './code-parser.interface';
import { JavaScriptParser } from './parsers/java-script.parser';
import { languages } from 'generated/prisma/enums';
import { PythonParser } from './parsers/python.parser';

@Injectable()
export class GetCodeParserFactory {
    constructor(
        private javaScriptParser: JavaScriptParser,
        private pythonParser: PythonParser,
    ) {}
    getCodeParser(language: languages): CodeParser {
        switch (language) {
            case languages.JavaScript: {
                return this.javaScriptParser;
            }
            case languages.Python: {
                return this.pythonParser;
            }
            default: {
                return this.javaScriptParser;
            }
        }
    }
}
