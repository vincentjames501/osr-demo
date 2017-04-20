const argv = require('yargs')
    .usage('Usage: $0 -o [output] -f [file]')
    .describe('o', 'Where to writ the file to')
    .default('o', 'out.csv')
    .alias('o', 'out')
    .string('o')
    .nargs('o', 1)
    .describe('f', 'Load a file')
    .alias('f', 'file')
    .string('f')
    .demandOption(['o', 'f'])
    .help('h')
    .alias('h', 'help')
    .argv;
const fs = require('fs');
const Tesseract = require('tesseract.js');
const ProgressBar = require('progress');
const stringify = require('csv-stringify');
const _ = require('lodash');

const header = ['measurements', 'orderNo', 'length', 'type', 'purchaseOrderNumber', 'code', 'itemNo', 'customerItemNo', 'warningLabel', 'heatNo', 'C', 'MN', 'P', 'S', 'AL', 'SI', 'CB', 'CU', 'CR', 'NI', 'V', 'MO', 'B', 'TI', 'N', 'CE', 'YLDpsi', 'TSNpsi', 'ELNpercent'];

function writeToCSV(csvData) {
    stringify(csvData, (err, output) => {
        if (err) {
            console.error('Failed to generate CSV information', err);
            process.exit(1);
        } else {
            fs.writeFile(argv.out, output, (err) => {
                if(err) {
                    console.error('Failed to write CSV', err);
                } else {
                    console.log('Complete!');
                    process.exit(0);
                }
            });
        }
    });
}

function parsePoTypeAndLength(line) {
    const segments = line.split(/\s+/);
    const length = _.take(segments, 2).join(' ');
    const purchaseOrderNumber = _.takeRight(segments, 2).join(' ');
    const type = segments.slice(2, segments.length - 2).join(' ');
    return [length, type, purchaseOrderNumber];
}

function parseText(text) {
    const csvData = [header];

    const lines = text.split('\n');

    const sectionIndexes = _.reduce(lines, (acc, line, idx) => {
        if (_.includes(line, 'Ladle Analysis')) {
            acc.push(idx);
        }
        return acc;
    }, []);

    _.forEach(sectionIndexes, sectionIndex => {
        const [measurements, orderNo] = lines[sectionIndex - 1].split(' Order ');
        const [length, type, purchaseOrderNumber] = parsePoTypeAndLength(lines[sectionIndex]);
        const [code, itemNo] = lines[sectionIndex + 1].split(' Item ');
        const [, customerItemNo] = lines[sectionIndex + 2].split('Customer Item ');

        const potentialRawMaterialLine = lines[sectionIndex + 3];
        let warningLabel = '';
        let nextOffset = 0;
        if (_.includes(potentialRawMaterialLine, 'Raw Material')) {
            warningLabel = potentialRawMaterialLine;
            nextOffset = 1;
        }

        const [, heatNo] = lines[sectionIndex + 3 + nextOffset].split('Heat # : ');
        const [C, MN, P, S, AL, SI, CB, CU, CR, NI, V, MO, B, TI, N, CE, YLDpsi, TSNpsi, ELNpercent] = lines[sectionIndex + 5 + nextOffset].split(/\s+/);

        csvData.push([measurements, orderNo, length, type, purchaseOrderNumber, code, itemNo, customerItemNo, warningLabel, heatNo, C, MN, P, S, AL, SI, CB, CU, CR, NI, V, MO, B, TI, N, CE, YLDpsi, TSNpsi, ELNpercent]);
    });

    writeToCSV(csvData);
}

function parseFile(file) {
    const bar = new ProgressBar(':bar :percent (:status)', {total: 40});
    bar.update(0, {status: `Loading "${file}"... This may take a while.`});

    Tesseract.recognize(file, {
        tessedit_char_whitelist: '\'%"#.:/-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }).progress(({progress, status}) => {
        bar.update(progress, {status});
    }).catch(err => {
        console.error('Failed to process document for OSR.', err);
        process.exit(1);
    }).then(result => {
        parseText(result.text);
    });
}


_.forEach(_.isArray(argv.file) ? argv.file : [argv.file], file => parseFile(file));
