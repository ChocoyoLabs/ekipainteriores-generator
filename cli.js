#!/usr/bin/env node
'use strict';
const path = require('path');
const fs = require('fs');
const YAML = require('yamljs');
const csv = require('csvtojson');
const slug = require('slug');
const dateFormat = require('dateformat');
const sharp = require('sharp');
const ext = '.csv';

let fileName = process.argv[2];
let domain = process.argv[3];

if (!domain) {
  console.log('The domain is required.');
  return;
}

let filePath = path.join(process.cwd(), fileName);
if (!fileName) {
  console.log('The file name *data.csv* is required.');
} else if (path.extname(fileName) !== ext) {
  console.log('Only allow CSV extension.');
} else if (!fs.existsSync(filePath)) {
  console.log(`Te file ${filePath} don't exists.`);
} else {

  let imagesDirectory = path.join(process.cwd(), 'all_pictures');
  let imagesOutputDirectory = path.join(process.cwd(), 'assets', 'images', 'products');
  let postOutputDirectory = path.join(process.cwd(), '_posts');

  let dateTitle = dateFormat(new Date(), 'yyyy-mm-dd');
  csv()
  .fromFile(filePath)
  .on('json',(item)=>{
    let code = item['CODIGO'];
    let codeLowerCase = slug(code).toLowerCase();
    let imagePath = path.join(imagesDirectory, `${codeLowerCase}.jpg`);
    let imageOutputPath = path.join(imagesOutputDirectory, `${codeLowerCase}.jpg`);
    let imageUrl = '';

    let titleSlug = slug(item['DESCRIPCION']).toLowerCase();

    let outputFileName = `${dateTitle}-${titleSlug}-${codeLowerCase}.html`

    if (fs.existsSync(imagePath)) {
      imageUrl = `http://${domain}/assets/images/products/${codeLowerCase}.jpg`;
      sharp(imagePath)
      .resize(418, 560, {
        kernel: sharp.kernel.lanczos2,
        interpolator: sharp.interpolator.nohalo
      })
      .background('white')
      .embed()
      .toFile(imageOutputPath, (err, info) => {
        console.log(err);
        console.log(info);
      });
    } else {
      imageUrl = `http://ekipainteriores.com/assets/images/products/default.jpg`;
    }

    let itemClase = slug(item['CLASE']).toLowerCase();
    let itemGroup = slug(item['GRUPO']).toLowerCase();
    var permalink = `/${itemClase}/${itemGroup}/${titleSlug}/`

    let postObj = {
      layout: 'post',
      title: item['DESCRIPCION'],
      code: item['CODIGO'],
      date: new Date(),
      categories: slug(item['GRUPO']).toLowerCase(),
      image: imageUrl,
      description: item['DESCRIPCION'],
      permalink: permalink
    }

    let yamlString = YAML.stringify(postObj, 4);

    let outputFilePath = path.join(postOutputDirectory, outputFileName);

    // create html file with output
    var fd = fs.openSync(outputFilePath, 'w');
    fs.writeSync(fd, '---\n');
    fs.writeSync(fd, yamlString);
    fs.writeSync(fd, '---');
    fs.closeSync(fd);
  })
  .on('done',(error)=>{
    console.log(error);
  });
}
