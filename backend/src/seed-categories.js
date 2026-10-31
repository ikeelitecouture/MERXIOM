require('dotenv').config();
const connectDB = require('./config/db');
const { Category } = require('./models');
const common=[{key:'color',label:'Colour',type:'select',options:['Black','White','Navy','Blue','Brown','Red','Other'],required:true},{key:'material',label:'Material',type:'text',required:false}];
const categories = [
  {name:'Phones & Tablets',slug:'phones-tablets',sortOrder:10,attributes:[{key:'condition',label:'Condition',type:'select',options:['New','Used','Refurbished'],required:true},{key:'storage',label:'Storage capacity',type:'text',required:false}]},
  {name:'Electronics',slug:'electronics',sortOrder:20,attributes:[{key:'condition',label:'Condition',type:'select',options:['New','Used','Refurbished'],required:false}]},
  {name:'Fashion',slug:'fashion',sortOrder:30,attributes:[{key:'size',label:'Size',type:'select',options:['S','M','L','XL','2XL','3XL'],required:true},...common]},
  {name:'Shoes',slug:'shoes',sortOrder:40,attributes:[{key:'size',label:'Shoe size',type:'text',required:true},...common]},
  {name:'Beauty',slug:'beauty',sortOrder:50,attributes:[{key:'skinType',label:'Skin type',type:'text',required:false}]},
  {name:'Home & Living',slug:'home-living',sortOrder:60,attributes:[{key:'material',label:'Material',type:'text',required:false},{key:'dimensions',label:'Dimensions',type:'text',required:false}]},
  {name:'Computers',slug:'computers',sortOrder:70,attributes:[{key:'condition',label:'Condition',type:'select',options:['New','Used','Refurbished'],required:false},{key:'ram',label:'RAM',type:'text',required:false}]},
  {name:'Accessories',slug:'accessories',sortOrder:80,attributes:common},
  {name:'Sports & Fitness',slug:'sports-fitness',sortOrder:90,attributes:[{key:'size',label:'Size',type:'text',required:false}]},
  {name:'Baby & Kids',slug:'baby-kids',sortOrder:100,attributes:[{key:'ageRange',label:'Age range',type:'text',required:false}]},
  {name:'Automotive',slug:'automotive',sortOrder:110,attributes:[{key:'makeModel',label:'Compatible make/model',type:'text',required:false}]},
  {name:'Services',slug:'services',sortOrder:120,attributes:[{key:'serviceArea',label:'Service area',type:'text',required:false},{key:'availability',label:'Availability',type:'text',required:false}]}
];
(async()=>{try{await connectDB();for(const item of categories) await Category.updateOne({slug:item.slug},{$set:{name:item.name,sortOrder:item.sortOrder,active:true,attributes:item.attributes}}, {upsert:true});console.log('MERXIOM categories ensured (no products seeded).');await require('mongoose').disconnect();}catch(e){console.error(e.message);process.exit(1);}})();
