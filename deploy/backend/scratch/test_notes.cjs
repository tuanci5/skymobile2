const API_BASE_URL = 'http://localhost:3001';

async function testNotes() {
  try {
    // 1. Fetch conversations to get a valid ID
    console.log('Fetching conversations...');
    const convsRes = await fetch(`${API_BASE_URL}/api/fb/conversations`);
    const convs = await convsRes.json();
    
    if (convs.length === 0) {
      console.log('No conversations found to test with.');
      return;
    }
    
    const testConvId = convs[0].id;
    console.log(`Testing with conversation ID: ${testConvId}`);
    
    // 2. Add a new note
    console.log('Adding a test note...');
    const addRes = await fetch(`${API_BASE_URL}/api/fb/conversations/${testConvId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        note: 'Test note from Antigravity ' + new Date().toISOString(),
        author_name: 'Antigravity Test',
        author_email: 'antigravity@test.com'
      })
    });
    const addData = await addRes.json();
    console.log('Add note response:', addData);
    
    // 3. Fetch notes
    console.log('Fetching notes...');
    const getRes = await fetch(`${API_BASE_URL}/api/fb/conversations/${testConvId}/notes`);
    const notes = await getRes.json();
    console.log('Notes list:', notes);
    
    if (notes.some(n => n.note_text.includes('Antigravity Test'))) {
      console.log('✅ TEST PASSED: Note successfully added and retrieved.');
    } else {
      console.log('❌ TEST FAILED: Note not found in retrieved list.');
    }
    
  } catch (err) {
    console.error('Test error:', err);
  }
}

testNotes();
