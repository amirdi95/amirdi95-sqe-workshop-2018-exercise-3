import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

export {parseCode , cfg};

function parseArguments(args){
    let ret ;
    if (args.expression.type === 'SequenceExpression')
        ret = args.expression.expressions.map(e => eval(escodegen.generate(e)));
    else {
        ret = [eval(escodegen.generate(args.expression))];
    }
    return ret;
}

let main_handler = {
    'VariableDeclaration':caseVariableDeclaration,
    'WhileStatement' :caseWhileStatement,
    'ReturnStatement':caseReturnStatement,
    'AssignmentExpression':caseAssignmentExpression,
    'IfStatement':caseIfStatement};

function startHandler(node ,paramsTable ,variablesTable){
    return main_handler[node.type]? (main_handler[node.type](node, paramsTable, variablesTable)) : '';
}

let indexCond;
let indexPara;
let indexOp;
let indexConn;
let nimbur ;

function cfg(parsedCode) {
    indexCond=1;
    indexPara=1;
    indexOp=1;
    indexConn =1;
    nimbur = 1;
    let  paramsTable = [] , variablesTable = [];
    let args;
    let str = '';
    for(let i = 0 ; i<parsedCode.body.length ; i++) {
        if(parsedCode.body[i].type === 'ExpressionStatement'){
            args = parseArguments(parsedCode.body[i]);
        }
        if (parsedCode.body[i].type === 'FunctionDeclaration') {
            return caseFunctionDeclaration(parsedCode.body[i] ,parsedCode , paramsTable,variablesTable ,args ,str);
        }
    }
}

function caseFunctionDeclaration(body , parsedCode , paramsTable , variablesTable,args , str) {
    for (let j = 0; j < body.params.length; j++)
        paramsTable.push({name :escodegen.generate(body.params[j]) , value :args[j]});
    str = start(body, paramsTable, variablesTable,str);
    return str ;
}

function start(code, paramsTable, variablesTable , str) {
    estraverse.replace(code, {
        enter: function (node) {
            if(node.type === 'WhileStatement') {
                str = str + startHandler(node, paramsTable, variablesTable);
                this.skip();
            }
            else if(node.type === 'IfStatement'){str = str + startHandler(node, paramsTable, variablesTable);
                str =str +'conn'+indexConn.toString() + '=>start: .|green\n';
                indexConn++;
                this.skip();}
            else{str = str + startHandler(node, paramsTable, variablesTable);}
        }
    });
    return str;
}

function caseVariableDeclaration(node,paramsTable,variablesTable) {
    let tmpStr = '';
    let b = node.declarations ,id , init;
    for(let i = 0 ; i<b.length ; i++){
        id = b[i].id.name;
        if(b[i].init !== null){
            init = escodegen.generate(b[i].init);
        }
        else{init = null;}
        variablesTable.push({name : id , value : init});
        tmpStr = tmpStr +'op'+indexOp.toString() + '=>operation: #'+(nimbur++) +'# ' +  id + '=' + init+ '|green\n';
        indexOp++;
    }
    return tmpStr;
}

function caseAssignmentExpression(node , paramsTable ,variablesTable) {
    let tmpStr = '';
    let right = escodegen.generate(node.right);
    for(let i =0 ; i<variablesTable.length ; i++){
        if(variablesTable[i].name === node.left.name) {
            variablesTable[i].value = right;
        }
    }
    for(let i =0 ; i<paramsTable.length ; i++){
        if(paramsTable[i].name === node.left.name) {
            paramsTable[i].value = right;
        }
    }
    tmpStr = tmpStr +'op'+indexOp.toString() + '=>operation: #'+(nimbur++) +'# '+ node.left.name + '=' + right +'|green\n';
    indexOp ++;
    return tmpStr;
}


//---------------------------------------------------------------while

function caseWhileStatement(node , paramsTable , variablesTable) {
    let tmpStr = 'op'+indexOp.toString() + '=>operation: ' + 'NULL\n';
    indexOp ++;
    let test =  escodegen.generate(node.test);//(changeVar(node.test, paramsTable, variablesTable)));
    tmpStr = tmpStr +'cond'+indexCond.toString() + '=>condition: #' +(nimbur++) +'# '+ test+'\n';
    tmpStr =  tmpStr + caseBodyWhile(node.body, paramsTable, variablesTable);
    indexCond++;
    return tmpStr;
}

function caseBodyWhile(body, paramsTable, variablesTable){
    let tmpStr = 'op'+indexOp + '=>operation: #'+(nimbur++) +'# ';
    estraverse.replace(body, {
        enter: function (node) {
            if(node.type === 'VariableDeclaration'){tmpStr = tmpStr + caseVariableDeclarationWhile(node,paramsTable,variablesTable);}
            else if(node.type === 'AssignmentExpression'){tmpStr = tmpStr + caseAssignmentExpressionWhile(node,paramsTable,variablesTable);}
            else if(node.type === 'UpdateExpression'){tmpStr = tmpStr + caseUpdateExpressionWhile(node,paramsTable,variablesTable);}
        }
    });
    indexOp++;
    return tmpStr ;
}

function caseVariableDeclarationWhile(node,paramsTable,variablesTable) {
    let tmpStr = '';
    let b = node.declarations ,id , init;
    for(let i = 0 ; i<b.length ; i++){
        id = b[i].id.name;
        if(b[i].init !== null){
            init = escodegen.generate(b[i].init);}
        else{init = null;}
        variablesTable.push({name : id , value : init});
        tmpStr = tmpStr  +  id + '=' + init+ '\n';
    }
    return tmpStr;
}

function caseAssignmentExpressionWhile(node , paramsTable ,variablesTable) {
    let tmpStr = '';
    let right = escodegen.generate(node.right);//(changeVar(node.right , paramsTable , variablesTable)));
    for(let i =0 ; i<variablesTable.length ; i++){
        if(variablesTable[i].name === node.left.name) {
            variablesTable[i].value = right;
        }
    }
    for(let i =0 ; i<paramsTable.length ; i++){
        if(paramsTable[i].name === node.left.name) {
            paramsTable[i].value = right;
        }
    }
    tmpStr = tmpStr + node.left.name + '=' + right +'\n';
    return tmpStr;
}

function caseUpdateExpressionWhile(node) {
    let tmpStr = '';
    let name = node.argument.name;
    tmpStr = tmpStr + name + node.operator+'\n';
    return tmpStr;
}

//---------------------------------------------------------------while


function caseReturnStatement(node) {
    let tmpStr = '';
    let argument = (escodegen.generate(node.argument));
    tmpStr = tmpStr +'op'+indexOp.toString() + '=>operation: #'+(nimbur++) +'# '+'return ' + argument +'|green\n';
    indexOp ++;
    return tmpStr;
}

function caseIfStatement(node , paramsTable , variablesTable){
    let tmpStr ='' , newVariablesTable1 = JSON.parse(JSON.stringify(variablesTable)) , newVariablesTable2 = JSON.parse(JSON.stringify(variablesTable));
    let newParamsTable1 = JSON.parse(JSON.stringify(paramsTable)) , newParamsTable2 = JSON.parse(JSON.stringify(paramsTable));
    let test = escodegen.generate(node.test);
    tmpStr = tmpStr +'cond'+indexCond.toString() + '=>condition: #'+(nimbur++) +'# ' + test+'\n' + 'para'+indexPara.toString()+'=>parallel: #'+(nimbur++)+'# ';
    indexCond++;
    indexPara++;
    estraverse.replace(node.consequent, {
        enter: function (body) {
            if(body.type === 'VariableDeclaration'){tmpStr = tmpStr + caseVariableDeclarationIf(body,newParamsTable1,newVariablesTable1);}
            else if(body.type === 'AssignmentExpression'){tmpStr = tmpStr + caseAssignmentExpressionIf(body,newParamsTable1,newVariablesTable1);}
            else if(body.type === 'UpdateExpression'){tmpStr = tmpStr + caseUpdateExpressionIf(body,newParamsTable1,newVariablesTable1);}
        }
    });
    if(node.alternate !== null){tmpStr = tmpStr + caseAlternate(node.alternate ,newParamsTable2 , newVariablesTable2 );}
    return (tmpStr + '\n');
}

function caseAlternate(node ,newParamsTable , newVariablesTable) {
    let tmpStr = '\n' , wasOp=false;
    estraverse.traverse(node, {
        enter: function (body) {
            if(body.type === 'IfStatement'){
                tmpStr = tmpStr + caseIfStatement(body,newParamsTable,newVariablesTable); this.skip(); indexOp++;}
            else if(body.type === 'VariableDeclaration'){
                tmpStr =altVar(tmpStr , wasOp ,body,newParamsTable,newVariablesTable); wasOp = true;}
            else if(body.type === 'AssignmentExpression'){
                tmpStr = altAss(tmpStr , wasOp ,body,newParamsTable,newVariablesTable); wasOp = true;}
            else if(body.type === 'UpdateExpression'){
                tmpStr = altUpd(tmpStr , wasOp ,body,newParamsTable,newVariablesTable); wasOp = true;}
        }
    });

    return tmpStr;
}

function altVar(tmpStr , wasOp ,body,newParamsTable,newVariablesTable){
    return tmpStr +(wasOp? '' : ('op'+indexOp.toString() + '=>operation: #' + (nimbur++) +'# ')) + caseVariableDeclarationIf(body,newParamsTable,newVariablesTable);
}

function altAss(tmpStr , wasOp ,body,newParamsTable,newVariablesTable){
    return tmpStr + (wasOp? '' : ('op'+indexOp.toString() + '=>operation: #'+ (nimbur++) +'# ')) + caseAssignmentExpressionIf(body,newParamsTable,newVariablesTable);
}

function altUpd(tmpStr , wasOp ,body,newParamsTable,newVariablesTable){
    return tmpStr +(wasOp? '' : ('op'+indexOp.toString() + '=>operation: #'+ (nimbur++) +'# ')) + caseUpdateExpressionIf(body,newParamsTable,newVariablesTable);
}

function caseVariableDeclarationIf(node,paramsTable,variablesTable) {
    let tmpStr = '';
    let b = node.declarations ,id , init;
    for(let i = 0 ; i<b.length ; i++){
        id = b[i].id.name;
        if(b[i].init !== null){
            init = escodegen.generate(b[i].init);}
        else{init = null;}
        variablesTable.push({name : id , value : init});
        tmpStr = tmpStr  +  id + '=' + init+ ' ';
    }
    return tmpStr;
}

function caseAssignmentExpressionIf(node , paramsTable ,variablesTable) {
    let tmpStr = '';
    let right = escodegen.generate(node.right);//(changeVar(node.right , paramsTable , variablesTable)));
    for(let i =0 ; i<variablesTable.length ; i++){
        if(variablesTable[i].name === node.left.name) {
            variablesTable[i].value = right;
        }
    }
    for(let i =0 ; i<paramsTable.length ; i++){
        if(paramsTable[i].name === node.left.name) {
            paramsTable[i].value = right;
        }
    }
    tmpStr = tmpStr + node.left.name + '=' + right +' ';
    return tmpStr;
}

function caseUpdateExpressionIf(node) {
    let tmpStr = '';
    let name = node.argument.name;
    tmpStr = tmpStr + name +node.operator+ '\n';
    return tmpStr;
}


// function evalTest(paramsTable , variablesTable , test) {
//     let r;
//     let result = estraverse.replace(test, {
//         enter: function (node) {
//             // Replace it with replaced.
//             if (node.type === 'Identifier') {
//                 return ifExistReturn(node.name, variablesTable, paramsTable);
//
//             }
//         }
//     });
//     return result;
// }
// function ifExistReturn(name , variablesTable , paramsTable) {
//     let pc;
//     for(let i = 0 ; i < variablesTable.length ; i++) {
//         if (variablesTable[i].name === name) {
//             pc = parseCode(variablesTable[i].value);
//             return pc.body[0];
//         }
//     }
//     for(let i = 0 ; i < paramsTable.length ; i++){
//         if(paramsTable[i].name === name){
//             pc = parseCode(paramsTable[i].value);
//             return pc.body[0];
//         }
//     }
//
// }
