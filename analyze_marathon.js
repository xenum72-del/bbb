const fs = require('fs');

// Try to read the backup file from Downloads
const backupPath = process.env.HOME + '/Downloads/the-load-down-backup-2025-10-19T20-05-15-full.json';

try {
  const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  
  console.log('Analyzing Marathon (3+ hrs) usage...\n');
  
  // Find Marathon (3+ hrs) interaction type
  const marathonType = data.interactionTypes.find(t => t.name === 'Marathon (3+ hrs)');
  console.log('Marathon interaction type:', marathonType);
  
  // Count encounters where Marathon (3+ hrs) is the main activity
  const asMainCount = data.encounters.filter(e => e.activityType === 'Marathon (3+ hrs)').length;
  console.log(`\nAs Main Activity: ${asMainCount}`);
  
  // Count encounters where Marathon (3+ hrs) appears in activitiesPerformed
  const inActivitiesCount = data.encounters.filter(e => 
    e.activitiesPerformed && e.activitiesPerformed.includes('Marathon (3+ hrs)')
  ).length;
  console.log(`In Activities Performed: ${inActivitiesCount}`);
  
  // Check for overlaps (encounters that have Marathon as both main and in activities)
  const bothCount = data.encounters.filter(e => 
    e.activityType === 'Marathon (3+ hrs)' && 
    e.activitiesPerformed && 
    e.activitiesPerformed.includes('Marathon (3+ hrs)')
  ).length;
  console.log(`Appears in Both: ${bothCount}`);
  
  console.log(`\nTotal appearances: ${asMainCount + inActivitiesCount}`);
  console.log(`Unique encounters: ${asMainCount + inActivitiesCount - bothCount}`);
  
  // Also check Marathon Session for comparison
  const marathonSessionAsMain = data.encounters.filter(e => e.activityType === 'Marathon Session').length;
  const marathonSessionInActivities = data.encounters.filter(e => 
    e.activitiesPerformed && e.activitiesPerformed.includes('Marathon Session')
  ).length;
  
  console.log(`\nFor comparison - Marathon Session:`);
  console.log(`As Main: ${marathonSessionAsMain}`);
  console.log(`In Activities: ${marathonSessionInActivities}`);
  
} catch (error) {
  console.error('Error:', error.message);
}
