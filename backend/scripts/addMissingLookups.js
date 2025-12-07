const db = require('../config/database');

const lookupData = {
  'Work Location': [
    { type_id: 'Onsite', type_name: 'Onsite', description: 'Working at client location', sort_order: 1 },
    { type_id: 'Offshore', type_name: 'Offshore', description: 'Working from offshore location', sort_order: 2 },
   
  ],
  'Criticality': [
    { type_id: 'Critical', type_name: 'Critical', description: 'Critical employee', sort_order: 1 },
    { type_id: 'High', type_name: 'High', description: 'High priority', sort_order: 2 },
    { type_id: 'Medium', type_name: 'Medium', description: 'Medium priority', sort_order: 3 },
    { type_id: 'Low', type_name: 'Low', description: 'Low priority', sort_order: 4 }
  ],
  'Status': [
    { type_id: 'Active', type_name: 'Active', description: 'Currently active employee', sort_order: 1 },
    { type_id: 'Inactive', type_name: 'Inactive', description: 'Inactive employee', sort_order: 2 },
    { type_id: 'On Leave', type_name: 'On Leave', description: 'On leave', sort_order: 3 },
    { type_id: 'Terminated', type_name: 'Terminated', description: 'Employment terminated', sort_order: 4 }
  ],
  'Visa Type': [
    { type_id: 'None', type_name: 'None', description: 'No visa required', sort_order: 1 },
    { type_id: 'H1B', type_name: 'H1B', description: 'H1B visa', sort_order: 2 },
    { type_id: 'L1', type_name: 'L1', description: 'L1 visa', sort_order: 3 },
    { type_id: 'L2', type_name: 'L2', description: 'L2 visa', sort_order: 4 },
    { type_id: 'Green Card', type_name: 'Green Card', description: 'US Green Card holder', sort_order: 5 },
    { type_id: 'US Citizen', type_name: 'US Citizen', description: 'US Citizen', sort_order: 6 },
    { type_id: 'OPT', type_name: 'OPT', description: 'Optional Practical Training', sort_order: 7 },
    { type_id: 'CPT', type_name: 'CPT', description: 'Curricular Practical Training', sort_order: 8 },
    { type_id: 'Other', type_name: 'Other', description: 'Other visa type', sort_order: 9 }
  ]
};

async function addMissingLookups() {
  try {
    console.log('Starting to add missing lookup values...\n');

    for (const [category, values] of Object.entries(lookupData)) {
      console.log(`Processing category: ${category}`);

      // Check if category already exists
      const [existing] = await db.query(
        'SELECT COUNT(*) as count FROM common_lookups WHERE category = ?',
        [category]
      );

      if (existing[0].count > 0) {
        console.log(`  ⚠️  Category '${category}' already has ${existing[0].count} entries. Skipping...`);
        continue;
      }

      // Insert all values for this category
      for (const value of values) {
        await db.query(
          'INSERT INTO common_lookups (category, type_id, type_name, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
          [category, value.type_id, value.type_name, value.description, value.sort_order]
        );
        console.log(`  ✅ Added: ${value.type_name}`);
      }
    }

    console.log('\n✅ Successfully added all missing lookup values!');

    // Display summary
    const [allCategories] = await db.query(
      'SELECT category, COUNT(*) as count FROM common_lookups WHERE is_active = TRUE GROUP BY category ORDER BY category'
    );

    console.log('\n📊 Summary of all lookup categories:');
    allCategories.forEach(cat => {
      console.log(`  - ${cat.category}: ${cat.count} entries`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding lookup values:', error);
    process.exit(1);
  }
}

addMissingLookups();
