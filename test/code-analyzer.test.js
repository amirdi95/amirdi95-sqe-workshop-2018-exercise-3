import assert from 'assert';
import {parseCode , cfg } from '../src/js/code-analyzer';

describe('check cfg',() => {
    it('2 let 3 arg', () => {
        assert(cfg(parseCode('1,2,3\n' +
            'function foo(x, y, z){\n' +
            'let a = x + 1; \n' +
            'let b = a + y;\n' +
            '}'))
            === 'op1=>operation: #1# a=x + 1|green\n' +
            'op2=>operation: #2# b=a + y|green\n');
    });
    it('1 let 1 return', () => {
        assert(cfg(parseCode('1,2,3\n' +
            'function foo(x, y, z){\n' +
            'let a = x + 1; \n' +
            'return a;\n' +
            '}'))
            === 'op1=>operation: #1# a=x + 1|green\n' +
            'op2=>operation: #2# return a|green\n');
    });
});

describe('check while',() => {
    it('while 1 return', () => {
        assert(cfg(parseCode('1,2,3\n' + 'function foo(x, y, z){\n' + '   let a = x + 1;\n' + '   let b = a + y;\n' +
            '   let c = 0;\n' + '   while (a < z) {\n' + '       c = a + b;\n' + '       z = c * 2;\n' + '       a++;\n' +
            '   }\n' + '   return z;\n' + '}'))
            === 'op1=>operation: #1# a=x + 1|green\n' + 'op2=>operation: #2# b=a + y|green\n' +
            'op3=>operation: #3# c=0|green\n' + 'op4=>operation: NULL\n' + 'cond1=>condition: #4# a < z\n' +
            'op5=>operation: #5# c=a + b\n' + 'z=c * 2\n' + 'a++\n' + 'op6=>operation: #6# return z|green\n');
    });
});

describe('check while with let',() => {
    it('while let return', () => {
        assert(cfg(parseCode('1,2,3\n' + 'function foo(x, y, z){\n' +
            '   let a = x + 1;\n' +'   let b = a + y;\n' + '   let c ;\n' + '   while (a < z) {\n' +
            '       let r = 0;\n' + '       c = a + b;\n' + '       z = c * 2;\n' + '       a++;\n' +
            '   }\n' +'   return z;\n' + '}'))
            === 'op1=>operation: #1# a=x + 1|green\n' + 'op2=>operation: #2# b=a + y|green\n' +
            'op3=>operation: #3# c=null|green\n' +'op4=>operation: NULL\n' +
            'cond1=>condition: #4# a < z\n' + 'op5=>operation: #5# r=0\n' +
            'c=a + b\n' +'z=c * 2\n' +
            'a++\n' + 'op6=>operation: #6# return z|green\n');
    });
});


describe('check while with let',() => {
    it('while let return', () => {
        assert(cfg(parseCode('1,2,3\n' +'function foo(x, y, z){\n' +'   let a;\n' +'   a=5;\n' +'   let b = a + y;\n' +
            '   let c ;\n' +  '   c = a ;\n' + '   while (a < z) {\n' +  '       let r;\n' + '       c = b;\n' +
            '       z = c * 2;\n' + '       a++;\n' + '   }\n' + '   return z;\n' + '}'))
            === 'op1=>operation: #1# a=null|green\n' + 'op2=>operation: #2# a=5|green\n' + 'op3=>operation: #3# b=a + y|green\n' +
            'op4=>operation: #4# c=null|green\n' + 'op5=>operation: #5# c=a|green\n' +
            'op6=>operation: NULL\n' + 'cond1=>condition: #6# a < z\n' + 'op7=>operation: #7# r=null\n' +
            'c=b\n' + 'z=c * 2\n' + 'a++\n' + 'op8=>operation: #8# return z|green\n');
    });
});

describe('check if',() => {
    it('if return', () => {
        assert(cfg(parseCode('1\n' +'function foo(x){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' + '    if (b < 3) {\n' + '        c = c + 5;\n' + '    } else if (b < a * 2) {\n' +
            '        c = c + x + 5;\n' + '    } else {\n' + '        c = c + 2;\n' + '    }\n' + '    return c;\n' +'}'))
            === 'op1=>operation: #1# a=x + 1|green\n' +'op2=>operation: #2# b=a + y|green\n' +
            'op3=>operation: #3# c=0|green\n' +'cond1=>condition: #4# b < 3\n' +
            'para1=>parallel: #5# c=c + 5 \n' + 'cond2=>condition: #6# b < a * 2\n' +
            'para2=>parallel: #7# c=c + x + 5 \n' + 'op4=>operation: #8# c=c + 2 \n' +
            '\n' +'conn1=>start: .|green\n' + 'op5=>operation: #9# return c|green\n');
    });
});

describe('check if',() => {
    it('if ifelse else return', () => {
        assert(cfg(parseCode('1\n' +
            'function foo(x){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' +
            '    let c = 0;\n' + '    x = 7;\n' + '\n' + '    if (b < 3) {\n' +
            '        c = c + 5;\n' + '        let d = 90;\n' + '        a++;\n' + '    } else if (b < a * 2) {\n' +
            '        c = c + x + 5;\n' + '    } else {\n' +
            '        a--;\n' + '        let n = 4;\n' + '        c = c + 2;\n' + '    }\n' +
            '    return c;\n' +
            '}'))
            === 'op1=>operation: #1# a=x + 1|green\n' + 'op2=>operation: #2# b=a + y|green\n' +
            'op3=>operation: #3# c=0|green\n' + 'op4=>operation: #4# x=7|green\n' +
            'cond1=>condition: #5# b < 3\n' +'para1=>parallel: #6# c=c + 5 d=90 a++\n' +
            '\n' +'cond2=>condition: #7# b < a * 2\n' + 'para2=>parallel: #8# c=c + x + 5 \n' +
            'op5=>operation: #9# a--\n' + 'n=4 c=c + 2 \n' + '\n' +'conn1=>start: .|green\n' +
            'op6=>operation: #10# return c|green\n');
    });
});


describe('check if',() => {
    it('if else return', () => {
        assert(cfg(parseCode('1\n' +'function foo(x){\n' +'    let a = x + 1;\n' +'    let b = a + y;\n' +
            '    let c = 0;\n' + '    x = 7;\n' +'    if (b < 3) { a++; let n = c + 5; let d = 90;  \n' +
            '    } else {a--; let v = 56;} \n' +'    return c;\n' +'}\n'))
            === 'op1=>operation: #1# a=x + 1|green\n' +'op2=>operation: #2# b=a + y|green\n' +
            'op3=>operation: #3# c=0|green\n' +'op4=>operation: #4# x=7|green\n' +
            'cond1=>condition: #5# b < 3\n' + 'para1=>parallel: #6# a++\n' +
            'n=c + 5 d=90 \n' + 'op5=>operation: #7# a--\n' +
            'v=56 \n' +'conn1=>start: .|green\n' +
            'op5=>operation: #8# return c|green\n');
    });
});


describe('check if',() => {
    it('if return', () => {
        assert(cfg(parseCode('1\n' +'function foo(x){\n' + '    let c = 0;\n' + '    x = 7;\n' +
            '    if (c < 3) { let n; x = 8;} \n' +'    return c;\n' + '}'))
            === 'op1=>operation: #1# c=0|green\n' +
            'op2=>operation: #2# x=7|green\n' +
            'cond1=>condition: #3# c < 3\n' +
            'para1=>parallel: #4# n=null x=8 \n' +
            'conn1=>start: .|green\n' +
            'op3=>operation: #5# return c|green\n');
    });
});

describe('check if',() => {
    it('if return', () => {
        assert(cfg(parseCode('1\n' +'function foo(x){\n' +'    let c = 0;\n' + '    x = 7;\n' +
            '    if (c < 3) { a++;} \n' + '    else{let g = 8; a++;}\n' +'}'))
            === 'op1=>operation: #1# c=0|green\n' + 'op2=>operation: #2# x=7|green\n' +
            'cond1=>condition: #3# c < 3\n' + 'para1=>parallel: #4# a++\n' +
            '\n' +'op3=>operation: #5# g=8 a++\n' +'\n' +'conn1=>start: .|green\n');
    });
});