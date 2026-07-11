async function testJobicy() {
  console.log('⏳ Querying Jobicy Remote Jobs API v2...');
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=10&industry=development');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    console.log('Success!');
    console.log('Result count:', data.success ? data.jobs.length : 0);
    if (data.success && data.jobs.length > 0) {
      console.log('Sample Job:', {
        title: data.jobs[0].jobTitle,
        company: data.jobs[0].companyName,
        url: data.jobs[0].url,
        geo: data.jobs[0].jobGeo,
        date: data.jobs[0].pubDate
      });
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testJobicy();
