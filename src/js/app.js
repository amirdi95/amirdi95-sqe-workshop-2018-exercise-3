import $ from 'jquery';
import {parseCode , cfg} from './code-analyzer';
import * as flowchart from 'flowchart.js';

let lines;

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let a = cfg(parsedCode);
        let line = a.split(/\r?\n/);
        lines = line.filter(function (el) {
            return (el !== '');
        });

        initIdexes();
        let edges = getEdges(parsedCode);
        document.getElementById('diagram').innerHTML = '';
        makeDiagram(a + edges);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});

let indexOp , indexCond , indexPara ,indexConn ;

function startOp(lines){
    let str = '' , i=0;
    while(lines[i][0]==='o' && i<lines.length-1 &&lines[i+1][0]==='o'){
        str = str + 'op'+indexOp+'->';
        indexOp++;
        str = str + 'op'+ indexOp + '\n';
        i++;
    }
    return str;
}


function getEdges(parsedCode) {
    let body = parsedCode.body[1].body.body , str = startOp(lines);
    if(body.length===0){return (str + 'op'+indexOp+'->op' + (indexOp+1) + '\n');}
    for(let i =0; i < body.length; i++){
        if (body[i].type === 'IfStatement')
            str = str + caseIfStatement(body[i],false);
        if (body[i].type === 'WhileStatement')
            str = str + caseWhileStatement();
    }
    return str;
}

function initIdexes() {
    indexOp = 1;
    indexCond = 1;
    indexPara = 1;
    indexConn = 1;
}


function caseIfStatement(ifStatement, go) {
    let index = indexCond++ , str = '';
    if (!go && !wasCond(index)) {
        str = 'op' + (indexOp) + '->cond' + index + '\n';
        indexOp++;
    }
    str = str + 'cond'+index+'(yes,right)->para'+indexPara+'\n';
    str = str + 'para'+indexPara+'(path1)->conn'+ indexConn +'\n';
    indexPara++;
    str = str + caseIfAlternate(ifStatement, index);
    if (ifStatement.alternate != null && ifStatement.alternate.type === 'IfStatement')
        str = str + caseIfStatement(ifStatement.alternate, true);
    return str;
}

function caseIfAlternate(ifStatement, index) {
    let str = '';
    if(ifStatement.alternate){
        if(ifStatement.alternate.type === 'IfStatement') {
            str = str + 'cond'+index+'(no)->cond'+ (index + 1)+'\n';
        }
        else {
            str = str + 'cond'+ index + '(no)->op' + indexOp +'\n';
            str = str +  'op'+indexOp+'->conn'+ indexConn+'\n';
            if(nextCond(index))
                str = str +  'conn'+ indexConn+'->cond'+(index + 1)+'\n';
            else
                str = str + 'conn'+indexConn+'->op'+(indexOp + 1) +'\n';
        }
    }
    else {
        str = str + helpCaseIfAlternate(index);
    }
    return str;
}

function helpCaseIfAlternate(index) {
    let str = '' +  'cond'+ index +'(no)->conn'+indexConn+'\n';
    if(nextCond(index))
        str = str +  'conn'+indexConn+'->cond'+(index + 1)+'\n';
    else
        str = str +  'conn'+indexConn+'->op'+(indexOp+1)+'\n';
    return str;
}

function wasCond(conditionIndex) {
    for(let i = 0; i < lines.length; i++)
        if(lines[i].includes('cond'+conditionIndex))
            return helpWasCond(i);
    return false;
}

function helpWasCond(i) {
    for(let j = i - 1; j > 0; j--) {
        if (lines[j].includes('cond'))
            return true;
        else if (lines[j][0]===('o'))
            return false;
    }
}


function nextCond(conditionIndex) {
    for(let i = 0; i < lines.length; i++)
        if(lines[i].includes('cond'+conditionIndex))
            return helpNextCond(i);
    return false;
}

function helpNextCond(i) {
    for(let j = i+1; j < lines.length; j++) {
        if (lines[j].includes('cond'))
            return true;
        else if (lines[j][0]===('o'))
            return false;
    }
}

function caseWhileStatement() {
    let index = indexCond++;
    let str ='';
    str = str + 'op'+ indexOp+'->cond'+index+'\n' ;
    indexOp++;
    str = str + `cond${index}(yes,right)->op${indexOp}\n` ;
    str = str + 'op'+ indexOp +'->op'+ (indexOp-1)+'\n';
    str = str + 'cond'+index+'(no)->op'+ (indexOp + 1)+'\n';
    return str;
}





// function createEdge(lines) {
//     indexPara =1 ; indexCond = 1; indexOp =1; let str = '';
//     for(let i =0 ; i<lines.length-1 ; i++){
//         if(lines[i][0]=== 'o' ){
//             str = str + 'op' + indexOp + '->' ;
//             indexOp++;
//             str = str + whatNext(lines, i) + '\n';
//         }
//         if(lines[i][0]=== 'c'){
//             str = str + 'cond'+indexCond+'(yes,right)->'+'para'+indexPara + '\n' + 'cond'+indexCond+'(no)->';
//             indexCond++;
//             str = str + whatNext(lines , i+1) +'\n';
//         }
//         if(lines[i][0]=== 'p'){
//             str = str + 'para'+indexPara+'(path1)->'+'op'+retPara(lines) + '\n';
//             indexPara++;
//         }
//     }
//     return str;
// }
//
// function whatNext(lines , i) {
//     switch (lines[i+1][0]) {
//     case 'o' :
//         return ('op' + indexOp);
//     case 'c' :
//         return ('cond'+ indexCond);
//     case 'p':
//         return ('para'+indexPara);
//     }
// }
//
// function retPara(lines){
//     let r = 1  , i = 0 ;
//     while(lines[i][0]==='o'){
//         r++;
//         i++;
//     }
//     return (r+1);
// }
//
// let indexOpW , indexCondW , indexParaW ;
//
// function createEdgeW(lines) {
//     indexParaW =1 ; indexCondW = 1; indexOpW =1; let str = '';
//     for(let i =0 ; i<lines.length-2 ; i++){
//         if(lines[i][0]=== 'o' ){
//             str = str + 'op' + indexOpW + '->' ;
//             indexOpW++;
//             str = str + whatNextW(lines, i) + '\n';
//         }
//         if(lines[i][0]=== 'c'){
//             str = str + 'cond'+indexCondW+'(yes,right)->'+'op'+indexOpW + '\n' +'op'+ indexOpW+'->op'+(indexOpW-1) +'\ncond'+indexCondW+'(no)->';
//             indexCondW++;
//             str = str + 'op'+(indexOpW+1) +'\n';
//         }
//         if(lines[i][0]=== 'p'){
//             str = str + 'para'+indexParaW+'(path1)->'+'op'+retPara(lines) + '\n';
//             indexParaW++;
//         }
//     }
//     return str;
// }
//
// function whatNextW(lines , i) {
//     switch (lines[i+1][0]) {
//     case 'o' :
//         return ('op' + indexOpW);
//     case 'c' :
//         return ('cond'+ indexCondW);
//     case 'p':
//         return ('para'+indexParaW);
//     }
// }

function makeDiagram(code){
    let diagram = flowchart.parse(code);
    diagram.drawSVG('diagram');
    diagram.drawSVG('diagram', {
        'flowstate' : { 'green' : { 'fill' : '#2bff00', 'font-size' : 17, 'yes-text' : 'T', 'no-text' : 'F' }}});
}