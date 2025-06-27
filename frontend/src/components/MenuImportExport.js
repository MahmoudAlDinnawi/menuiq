import React, { useState } from 'react';
import api from '../services/api';
import * as XLSX from 'xlsx';

const MenuImportExport = ({ categories, onImportSuccess }) => {
  const [importing, setImporting] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Generate template data
  const generateTemplate = () => {
    const templateData = [
      // Appetizers
      {
        name: 'Caesar Salad',
        nameAr: 'سلطة سيزر',
        category: 'appetizers',
        price: '32 SAR',
        priceWithoutVat: '28 SAR',
        description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese',
        descriptionAr: 'خس روماني طازج مع صلصة سيزر والخبز المحمص وجبنة البارميزان',
        calories: '280',
        walkMinutes: '35',
        runMinutes: '15',
        preparationTime: '10',
        servingSize: '200g',
        halal: 'TRUE',
        vegetarian: 'TRUE',
        vegan: 'FALSE',
        glutenFree: 'FALSE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'dairy,gluten,eggs',
        totalFat: '18',
        saturatedFat: '4',
        transFat: '0',
        cholesterol: '25',
        sodium: '380',
        totalCarbs: '22',
        dietaryFiber: '3',
        sugars: '4',
        protein: '8',
        vitaminA: '45',
        vitaminC: '35',
        calcium: '15',
        iron: '10'
      },
      {
        name: 'French Onion Soup',
        nameAr: 'شوربة البصل الفرنسية',
        category: 'appetizers',
        price: '28 SAR',
        priceWithoutVat: '24 SAR',
        description: 'Traditional French onion soup topped with melted cheese and croutons',
        descriptionAr: 'شوربة البصل الفرنسية التقليدية مع الجبنة الذائبة والخبز المحمص',
        calories: '320',
        walkMinutes: '40',
        runMinutes: '18',
        preparationTime: '25',
        servingSize: '300ml',
        halal: 'TRUE',
        vegetarian: 'TRUE',
        vegan: 'FALSE',
        glutenFree: 'FALSE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'TRUE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'dairy,gluten',
        totalFat: '15',
        saturatedFat: '8',
        transFat: '0',
        cholesterol: '40',
        sodium: '820',
        totalCarbs: '28',
        dietaryFiber: '3',
        sugars: '8',
        protein: '12',
        vitaminA: '15',
        vitaminC: '8',
        calcium: '25',
        iron: '6'
      },
      // Main Courses
      {
        name: 'Grilled Salmon',
        nameAr: 'سلمون مشوي',
        category: 'mains',
        price: '85 SAR',
        priceWithoutVat: '74 SAR',
        description: 'Fresh Atlantic salmon grilled to perfection with lemon butter sauce',
        descriptionAr: 'سلمون أطلسي طازج مشوي بإتقان مع صلصة الليمون والزبدة',
        calories: '420',
        walkMinutes: '55',
        runMinutes: '25',
        preparationTime: '20',
        servingSize: '200g',
        halal: 'TRUE',
        vegetarian: 'FALSE',
        vegan: 'FALSE',
        glutenFree: 'TRUE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'fish,dairy',
        totalFat: '24',
        saturatedFat: '6',
        transFat: '0',
        cholesterol: '95',
        sodium: '380',
        totalCarbs: '5',
        dietaryFiber: '1',
        sugars: '2',
        protein: '48',
        vitaminA: '8',
        vitaminC: '25',
        calcium: '4',
        iron: '8'
      },
      {
        name: 'Chicken Cordon Bleu',
        nameAr: 'دجاج كوردون بلو',
        category: 'mains',
        price: '68 SAR',
        priceWithoutVat: '59 SAR',
        description: 'Breaded chicken breast stuffed with ham and Swiss cheese',
        descriptionAr: 'صدر دجاج مقلي محشو بالجبنة السويسرية',
        calories: '580',
        walkMinutes: '75',
        runMinutes: '35',
        preparationTime: '30',
        servingSize: '300g',
        halal: 'TRUE',
        vegetarian: 'FALSE',
        vegan: 'FALSE',
        glutenFree: 'FALSE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'TRUE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'gluten,dairy,eggs',
        totalFat: '32',
        saturatedFat: '12',
        transFat: '0',
        cholesterol: '145',
        sodium: '920',
        totalCarbs: '28',
        dietaryFiber: '2',
        sugars: '3',
        protein: '42',
        vitaminA: '12',
        vitaminC: '4',
        calcium: '25',
        iron: '15'
      },
      // Steaks
      {
        name: 'Entrecôte Steak',
        nameAr: 'ستيك أنتريكوت',
        category: 'steaks',
        price: '145 SAR',
        priceWithoutVat: '126 SAR',
        description: 'Premium ribeye steak with our signature sauce and French fries',
        descriptionAr: 'ستيك ريب آي ممتاز مع صلصتنا المميزة والبطاطس المقلية',
        calories: '850',
        walkMinutes: '110',
        runMinutes: '50',
        preparationTime: '25',
        servingSize: '350g',
        halal: 'TRUE',
        vegetarian: 'FALSE',
        vegan: 'FALSE',
        glutenFree: 'TRUE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '1',
        allergens: 'dairy',
        totalFat: '48',
        saturatedFat: '20',
        transFat: '0',
        cholesterol: '165',
        sodium: '680',
        totalCarbs: '42',
        dietaryFiber: '4',
        sugars: '3',
        protein: '58',
        vitaminA: '4',
        vitaminC: '15',
        calcium: '6',
        iron: '35'
      },
      {
        name: 'Filet Mignon',
        nameAr: 'فيليه مينيون',
        category: 'steaks',
        price: '165 SAR',
        priceWithoutVat: '143 SAR',
        description: 'Tender beef tenderloin with mushroom sauce',
        descriptionAr: 'لحم بقري طري مع صلصة الفطر',
        calories: '680',
        walkMinutes: '88',
        runMinutes: '40',
        preparationTime: '30',
        servingSize: '250g',
        halal: 'TRUE',
        vegetarian: 'FALSE',
        vegan: 'FALSE',
        glutenFree: 'TRUE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'dairy',
        totalFat: '38',
        saturatedFat: '15',
        transFat: '0',
        cholesterol: '135',
        sodium: '520',
        totalCarbs: '8',
        dietaryFiber: '2',
        sugars: '3',
        protein: '62',
        vitaminA: '2',
        vitaminC: '0',
        calcium: '4',
        iron: '40'
      },
      // Desserts
      {
        name: 'Crème Brûlée',
        nameAr: 'كريم بروليه',
        category: 'desserts',
        price: '32 SAR',
        priceWithoutVat: '28 SAR',
        description: 'Classic French vanilla custard with caramelized sugar top',
        descriptionAr: 'كاسترد الفانيليا الفرنسي الكلاسيكي مع طبقة السكر المكرمل',
        calories: '380',
        walkMinutes: '49',
        runMinutes: '22',
        preparationTime: '15',
        servingSize: '150g',
        halal: 'TRUE',
        vegetarian: 'TRUE',
        vegan: 'FALSE',
        glutenFree: 'TRUE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'dairy,eggs',
        totalFat: '28',
        saturatedFat: '16',
        transFat: '0',
        cholesterol: '245',
        sodium: '85',
        totalCarbs: '28',
        dietaryFiber: '0',
        sugars: '26',
        protein: '6',
        vitaminA: '25',
        vitaminC: '0',
        calcium: '15',
        iron: '4'
      },
      {
        name: 'Chocolate Soufflé',
        nameAr: 'سوفليه الشوكولاتة',
        category: 'desserts',
        price: '38 SAR',
        priceWithoutVat: '33 SAR',
        description: 'Warm chocolate soufflé with vanilla ice cream',
        descriptionAr: 'سوفليه الشوكولاتة الدافئ مع آيس كريم الفانيليا',
        calories: '450',
        walkMinutes: '58',
        runMinutes: '26',
        preparationTime: '25',
        servingSize: '180g',
        halal: 'TRUE',
        vegetarian: 'TRUE',
        vegan: 'FALSE',
        glutenFree: 'FALSE',
        dairyFree: 'FALSE',
        nutFree: 'FALSE',
        highSodium: 'FALSE',
        containsCaffeine: 'TRUE',
        spicyLevel: '0',
        allergens: 'dairy,eggs,gluten,nuts',
        totalFat: '22',
        saturatedFat: '13',
        transFat: '0',
        cholesterol: '185',
        sodium: '125',
        totalCarbs: '58',
        dietaryFiber: '4',
        sugars: '48',
        protein: '9',
        vitaminA: '15',
        vitaminC: '0',
        calcium: '12',
        iron: '18'
      },
      // Beverages
      {
        name: 'Fresh Orange Juice',
        nameAr: 'عصير برتقال طازج',
        category: 'beverages',
        price: '18 SAR',
        priceWithoutVat: '16 SAR',
        description: 'Freshly squeezed orange juice',
        descriptionAr: 'عصير برتقال طازج',
        calories: '120',
        walkMinutes: '15',
        runMinutes: '7',
        preparationTime: '5',
        servingSize: '300ml',
        halal: 'TRUE',
        vegetarian: 'TRUE',
        vegan: 'TRUE',
        glutenFree: 'TRUE',
        dairyFree: 'TRUE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: '',
        totalFat: '0',
        saturatedFat: '0',
        transFat: '0',
        cholesterol: '0',
        sodium: '5',
        totalCarbs: '28',
        dietaryFiber: '1',
        sugars: '24',
        protein: '2',
        vitaminA: '4',
        vitaminC: '150',
        calcium: '4',
        iron: '2'
      },
      {
        name: 'Cappuccino',
        nameAr: 'كابتشينو',
        category: 'beverages',
        price: '22 SAR',
        priceWithoutVat: '19 SAR',
        description: 'Italian coffee with steamed milk foam',
        descriptionAr: 'قهوة إيطالية مع رغوة الحليب',
        calories: '90',
        walkMinutes: '12',
        runMinutes: '5',
        preparationTime: '5',
        servingSize: '180ml',
        halal: 'TRUE',
        vegetarian: 'TRUE',
        vegan: 'FALSE',
        glutenFree: 'TRUE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'TRUE',
        spicyLevel: '0',
        allergens: 'dairy',
        totalFat: '3.5',
        saturatedFat: '2',
        transFat: '0',
        cholesterol: '12',
        sodium: '65',
        totalCarbs: '9',
        dietaryFiber: '0',
        sugars: '8',
        protein: '4',
        vitaminA: '8',
        vitaminC: '0',
        calcium: '15',
        iron: '0'
      }
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    const colWidths = [
      { wch: 20 }, // name
      { wch: 20 }, // nameAr
      { wch: 15 }, // category
      { wch: 12 }, // price
      { wch: 15 }, // priceWithoutVat
      { wch: 40 }, // description
      { wch: 40 }, // descriptionAr
      { wch: 10 }, // calories
      { wch: 12 }, // walkMinutes
      { wch: 12 }, // runMinutes
      { wch: 15 }, // preparationTime
      { wch: 12 }, // servingSize
      { wch: 8 },  // halal
      { wch: 10 }, // vegetarian
      { wch: 8 },  // vegan
      { wch: 10 }, // glutenFree
      { wch: 10 }, // dairyFree
      { wch: 8 },  // nutFree
      { wch: 10 }, // highSodium
      { wch: 15 }, // containsCaffeine
      { wch: 10 }, // spicyLevel
      { wch: 20 }, // allergens
      // Nutrition columns
      { wch: 10 }, // totalFat
      { wch: 12 }, // saturatedFat
      { wch: 10 }, // transFat
      { wch: 12 }, // cholesterol
      { wch: 10 }, // sodium
      { wch: 12 }, // totalCarbs
      { wch: 12 }, // dietaryFiber
      { wch: 10 }, // sugars
      { wch: 10 }, // protein
      { wch: 10 }, // vitaminA
      { wch: 10 }, // vitaminC
      { wch: 10 }, // calcium
      { wch: 8 }   // iron
    ];
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add instructions sheet
    const instructions = [
      ['MENU IMPORT TEMPLATE - MENUIQ'],
      [''],
      ['INSTRUCTIONS:'],
      ['1. The "Menu Template" sheet contains 10 example items covering all categories'],
      ['2. You can modify these examples or add your own items below them'],
      ['3. Required fields: name, category, price, description, calories'],
      ['4. Delete any example rows you don\'t want to import'],
      [''],
      ['FIELD GUIDELINES:'],
      ['• Name: Item name in English (required)'],
      ['• NameAr: Item name in Arabic (optional)'],
      ['• Category: Must be one of: ' + categories.map(c => c.value).join(', ')],
      ['• Price: Price with VAT in format "XX SAR" (required)'],
      ['• PriceWithoutVat: Price before VAT in format "XX SAR" (optional)'],
      ['• Description: Item description in English (required)'],
      ['• DescriptionAr: Item description in Arabic (optional)'],
      ['• Calories: Number only (required)'],
      ['• WalkMinutes / RunMinutes: Numbers only (optional)'],
      ['• ServingSize: e.g., "250g", "300ml", "2 pieces" (optional)'],
      ['• PreparationTime: Number in minutes (optional)'],
      [''],
      ['DIETARY FIELDS (Use TRUE or FALSE):'],
      ['• halal, vegetarian, vegan, glutenFree, dairyFree, nutFree'],
      ['• highSodium, containsCaffeine'],
      [''],
      ['OTHER FIELDS:'],
      ['• SpicyLevel: 0 (not spicy) to 3 (very spicy)'],
      ['• Allergens: Comma-separated list (e.g., "dairy,gluten,nuts")'],
      ['  Available allergens: gluten, dairy, eggs, fish, shellfish, nuts, peanuts,'],
      ['  soy, sesame, celery, mustard, lupin, molluscs, sulphites'],
      [''],
      ['NUTRITION LABEL (All optional - leave blank if not available):'],
      ['• Fats: totalFat, saturatedFat, transFat (in grams)'],
      ['• Other: cholesterol (mg), sodium (mg), protein (g)'],
      ['• Carbs: totalCarbs, dietaryFiber, sugars (in grams)'],
      ['• Vitamins: vitaminA, vitaminC, calcium, iron (% daily value, 0-100)'],
      [''],
      ['TIPS:'],
      ['• Keep the header row intact'],
      ['• Don\'t change column names'],
      ['• You can copy/paste from your existing menu data'],
      ['• Save as .xlsx before uploading']
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    
    // Style the instructions sheet with column widths
    wsInstructions['!cols'] = [{ wch: 100 }];
    
    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");
    XLSX.utils.book_append_sheet(wb, ws, "Menu Template");
    
    // Download file with date
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `menuiq_template_${today}.xlsx`);
  };

  // Parse boolean values
  const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toUpperCase() === 'TRUE' || value === '1' || value.toUpperCase() === 'YES';
    }
    return false;
  };

  // Parse numeric values
  const parseNumber = (value, isFloat = false) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = isFloat ? parseFloat(value) : parseInt(value);
    return isNaN(num) ? null : num;
  };

  // Process imported data
  const processImportData = (data) => {
    const errors = [];
    const validItems = [];

    data.forEach((row, index) => {
      try {
        // Skip empty rows
        if (!row.name || !row.category || !row.price || !row.description) {
          if (row.name || row.category || row.price || row.description) {
            errors.push(`Row ${index + 2}: Missing required fields`);
          }
          return;
        }

        // Validate category
        const validCategories = categories.map(c => c.value);
        if (!validCategories.includes(row.category)) {
          errors.push(`Row ${index + 2}: Invalid category "${row.category}"`);
          return;
        }

        // Parse allergens
        const allergens = row.allergens ? 
          row.allergens.split(',').map(a => a.trim()).filter(a => a) : [];

        // Create item object
        const item = {
          name: row.name,
          nameAr: row.nameAr || '',
          category: row.category,
          price: row.price,
          priceWithoutVat: row.priceWithoutVat || '',
          description: row.description,
          descriptionAr: row.descriptionAr || '',
          calories: parseNumber(row.calories) || 0,
          walkMinutes: parseNumber(row.walkMinutes),
          runMinutes: parseNumber(row.runMinutes),
          preparationTime: parseNumber(row.preparationTime),
          servingSize: row.servingSize || '',
          halal: parseBoolean(row.halal),
          vegetarian: parseBoolean(row.vegetarian),
          vegan: parseBoolean(row.vegan),
          glutenFree: parseBoolean(row.glutenFree),
          dairyFree: parseBoolean(row.dairyFree),
          nutFree: parseBoolean(row.nutFree),
          highSodium: parseBoolean(row.highSodium),
          containsCaffeine: parseBoolean(row.containsCaffeine),
          spicyLevel: parseNumber(row.spicyLevel) || 0,
          allergens: allergens,
          // Nutrition fields
          totalFat: parseNumber(row.totalFat, true),
          saturatedFat: parseNumber(row.saturatedFat, true),
          transFat: parseNumber(row.transFat, true),
          cholesterol: parseNumber(row.cholesterol),
          sodium: parseNumber(row.sodium),
          totalCarbs: parseNumber(row.totalCarbs, true),
          dietaryFiber: parseNumber(row.dietaryFiber, true),
          sugars: parseNumber(row.sugars, true),
          protein: parseNumber(row.protein, true),
          vitaminA: parseNumber(row.vitaminA),
          vitaminC: parseNumber(row.vitaminC),
          calcium: parseNumber(row.calcium),
          iron: parseNumber(row.iron)
        };

        validItems.push(item);
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    });

    return { validItems, errors };
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setImportErrors([]);
      setImportSuccess(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!uploadFile) return;

    setImporting(true);
    setImportErrors([]);
    setImportSuccess(false);

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first sheet (or "Menu Template" sheet if it exists)
          const sheetName = workbook.SheetNames.includes('Menu Template') ? 
            'Menu Template' : workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            setImportErrors(['No data found in the file']);
            setImporting(false);
            return;
          }

          // Process and validate data
          const { validItems, errors } = processImportData(jsonData);
          
          if (errors.length > 0) {
            setImportErrors(errors);
          }

          if (validItems.length > 0) {
            // Import valid items using bulk API
            try {
              const response = await api.post('/api/menu-items/bulk', validItems);
              
              if (response.success && response.count > 0) {
                setImportSuccess(true);
                onImportSuccess();
                
                // Reset form after success
                setTimeout(() => {
                  setUploadFile(null);
                  setImportSuccess(false);
                  const fileInput = document.querySelector('input[type="file"]');
                  if (fileInput) {
                    fileInput.value = '';
                  }
                }, 3000);
              }
            } catch (error) {
              setImportErrors(prev => [...prev, `Bulk import failed: ${error.response?.data?.detail || error.message}`]);
            }
          } else if (errors.length === 0) {
            setImportErrors(['No valid items found to import']);
          }
        } catch (error) {
          setImportErrors([`Failed to read file: ${error.message}`]);
        } finally {
          setImporting(false);
        }
      };

      reader.readAsArrayBuffer(uploadFile);
    } catch (error) {
      setImportErrors([`Upload failed: ${error.message}`]);
      setImporting(false);
    }
  };

  // Get template data for preview
  const getTemplateData = () => {
    return [
      // Appetizers
      {
        name: 'Caesar Salad',
        nameAr: 'سلطة سيزر',
        category: 'appetizers',
        price: '32 SAR',
        priceWithoutVat: '28 SAR',
        description: 'Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese',
        descriptionAr: 'خس روماني طازج مع صلصة سيزر والخبز المحمص وجبنة البارميزان',
        calories: '280',
        walkMinutes: '35',
        runMinutes: '15',
        preparationTime: '10',
        servingSize: '200g',
        halal: 'TRUE',
        vegetarian: 'TRUE',
        vegan: 'FALSE',
        glutenFree: 'FALSE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'dairy,gluten,eggs'
      },
      {
        name: 'French Onion Soup',
        nameAr: 'شوربة البصل الفرنسية',
        category: 'appetizers',
        price: '28 SAR',
        priceWithoutVat: '24 SAR',
        description: 'Traditional French onion soup topped with melted cheese and croutons',
        descriptionAr: 'شوربة البصل الفرنسية التقليدية مع الجبنة الذائبة والخبز المحمص',
        calories: '320',
        walkMinutes: '40',
        runMinutes: '18',
        preparationTime: '25',
        servingSize: '300ml',
        halal: 'TRUE',
        vegetarian: 'TRUE',
        vegan: 'FALSE',
        glutenFree: 'FALSE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'TRUE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'dairy,gluten'
      },
      {
        name: 'Grilled Salmon',
        nameAr: 'سلمون مشوي',
        category: 'mains',
        price: '85 SAR',
        priceWithoutVat: '74 SAR',
        description: 'Fresh Atlantic salmon grilled to perfection with lemon butter sauce',
        descriptionAr: 'سلمون أطلسي طازج مشوي بإتقان مع صلصة الليمون والزبدة',
        calories: '420',
        walkMinutes: '55',
        runMinutes: '25',
        preparationTime: '20',
        servingSize: '200g',
        halal: 'TRUE',
        vegetarian: 'FALSE',
        vegan: 'FALSE',
        glutenFree: 'TRUE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'fish,dairy'
      },
      {
        name: 'Entrecôte Steak',
        nameAr: 'ستيك أنتريكوت',
        category: 'steaks',
        price: '145 SAR',
        priceWithoutVat: '126 SAR',
        description: 'Premium ribeye steak with our signature sauce and French fries',
        descriptionAr: 'ستيك ريب آي ممتاز مع صلصتنا المميزة والبطاطس المقلية',
        calories: '850',
        walkMinutes: '110',
        runMinutes: '50',
        preparationTime: '25',
        servingSize: '350g',
        halal: 'TRUE',
        vegetarian: 'FALSE',
        vegan: 'FALSE',
        glutenFree: 'TRUE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '1',
        allergens: 'dairy'
      },
      {
        name: 'Crème Brûlée',
        nameAr: 'كريم بروليه',
        category: 'desserts',
        price: '32 SAR',
        priceWithoutVat: '28 SAR',
        description: 'Classic French vanilla custard with caramelized sugar top',
        descriptionAr: 'كاسترد الفانيليا الفرنسي الكلاسيكي مع طبقة السكر المكرمل',
        calories: '380',
        walkMinutes: '49',
        runMinutes: '22',
        preparationTime: '15',
        servingSize: '150g',
        halal: 'TRUE',
        vegetarian: 'TRUE',
        vegan: 'FALSE',
        glutenFree: 'TRUE',
        dairyFree: 'FALSE',
        nutFree: 'TRUE',
        highSodium: 'FALSE',
        containsCaffeine: 'FALSE',
        spicyLevel: '0',
        allergens: 'dairy,eggs'
      }
    ];
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-playfair font-bold text-primary mb-6">Import/Export Menu</h2>
      
      {/* Download Template */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">Step 1: Download Template</h3>
        <p className="text-gray-600 mb-4">
          Download the Excel template with 10 ready-to-use menu items covering all categories.
        </p>
        
        {/* Preview Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setShowTemplatePreview(!showTemplatePreview)}
            className="text-primary hover:text-primary-dark flex items-center gap-2 text-sm font-medium"
          >
            <svg className={`w-4 h-4 transform transition-transform ${showTemplatePreview ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showTemplatePreview ? 'Hide' : 'Show'} Template Preview
          </button>
        </div>
        
        {/* Template Preview Table */}
        {showTemplatePreview && (
          <div className="mb-4 border border-gray-200 rounded-lg">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Template Preview - Sample Items</h4>
              <p className="text-sm text-gray-500 mt-1">The template includes 10 ready-to-use menu items with complete nutritional information</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Arabic Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Calories</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Halal</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vegetarian</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Allergens</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Walk Time</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getTemplateData().map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white">{item.name}</td>
                      <td className="px-3 py-2 text-sm text-gray-600" dir="rtl">{item.nameAr}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.category === 'appetizers' ? 'bg-blue-100 text-blue-700' :
                          item.category === 'mains' ? 'bg-green-100 text-green-700' :
                          item.category === 'steaks' ? 'bg-red-100 text-red-700' :
                          item.category === 'desserts' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 font-medium">{item.price}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{item.calories} cal</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.halal === 'TRUE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.halal}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.vegetarian === 'TRUE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.vegetarian}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {item.allergens || 'None'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {item.walkMinutes} min
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500 max-w-xs">
                        <div className="truncate" title={item.description}>
                          {item.description}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span>📊 All items include complete nutrition information (protein, fats, carbs, vitamins, etc.)</span>
                  <div className="mt-1 text-xs text-gray-500">
                    Additional items in template: Chicken Cordon Bleu, Filet Mignon, Chocolate Soufflé, Fresh Orange Juice, Cappuccino
                  </div>
                </div>
                <span className="font-medium text-sm text-gray-900">Total: 10 menu items</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={generateTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Full Template
          </button>
          <button
            onClick={() => {
              // Generate empty template
              const emptyData = [{
                name: '',
                nameAr: '',
                category: '',
                price: '',
                priceWithoutVat: '',
                description: '',
                descriptionAr: '',
                calories: '',
                walkMinutes: '',
                runMinutes: '',
                preparationTime: '',
                servingSize: '',
                halal: '',
                vegetarian: '',
                vegan: '',
                glutenFree: '',
                dairyFree: '',
                nutFree: '',
                highSodium: '',
                containsCaffeine: '',
                spicyLevel: '',
                allergens: '',
                totalFat: '',
                saturatedFat: '',
                transFat: '',
                cholesterol: '',
                sodium: '',
                totalCarbs: '',
                dietaryFiber: '',
                sugars: '',
                protein: '',
                vitaminA: '',
                vitaminC: '',
                calcium: '',
                iron: ''
              }];
              const ws = XLSX.utils.json_to_sheet(emptyData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Menu Template");
              const today = new Date().toISOString().split('T')[0];
              XLSX.writeFile(wb, `menuiq_empty_template_${today}.xlsx`);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            Download Empty Template
          </button>
        </div>
      </div>
      
      {/* Upload File */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Step 2: Upload Filled Template</h3>
        <p className="text-gray-600 mb-4">
          Fill the template with your menu items and upload it here.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleImport}
            disabled={!uploadFile || importing}
            className={`px-4 py-2 rounded-lg transition-colors ${
              uploadFile && !importing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
      
      {/* Success Message */}
      {importSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-700 font-medium">
            ✅ Menu items imported successfully!
          </p>
        </div>
      )}
      
      {/* Error Messages */}
      {importErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium mb-2">Import Errors:</p>
          <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
            {importErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Quick Guide:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Required fields: name, category, price, description, calories</li>
          <li>• Categories: {categories.map(c => c.value).join(', ')}</li>
          <li>• Boolean fields: Use TRUE/FALSE</li>
          <li>• Allergens: Comma-separated (e.g., dairy,nuts,gluten)</li>
          <li>• Nutrition fields are optional</li>
        </ul>
      </div>
    </div>
  );
};

export default MenuImportExport;