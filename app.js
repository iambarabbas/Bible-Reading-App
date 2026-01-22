const planPath = 'plan.json'
const daysEl = document.getElementById('days')
const weekLabel = document.getElementById('weekLabel')
const prevBtn = document.getElementById('prevWeek')
const nextBtn = document.getElementById('nextWeek')
const weekPassage = document.getElementById('weekPassage')
const resetBtn = document.getElementById('resetWeek')

let plan = { weeks: [] }
let currentWeek = 0
let todayWeekIndex = null

function storageKey(w, d){ return `bibleplan_w${w}_d${d}` }

function loadPlan(){
  return fetch(planPath)
    .then(r=>{
      if(!r.ok) throw new Error('HTTP ' + r.status)
      return r.json()
    })
    .catch(err=>{
      console.error('Failed to load plan.json:', err)
      daysEl.innerHTML = '<div class="error">Could not load <strong>plan.json</strong>. Please serve the files over HTTP (e.g. run <code>python -m http.server</code>) and reload the page.</div>'
      return {weeks:[]}
    })
}

function renderWeek(){
  if(!plan || !Array.isArray(plan.weeks) || plan.weeks.length === 0){
    weekLabel.textContent = ''
    daysEl.innerHTML = '<div class="error">No readings available. Edit <strong>plan.json</strong> or import a plan.</div>'
    weekPassage.textContent = ''
    return
  }
  const week = plan.weeks[currentWeek]
  if(!week) return
  // show a Mon–Fri date range in the header when possible (without the year)
  const firstReading = (week.days && week.days.length>0) ? week.days[0] : ''
  const parsedHeader = parseReading(firstReading || '')
  const parsedRange = parsedHeader.date ? parseRangeToDates(parsedHeader.date) : null
  if(parsedRange){
    const fmt = d => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
    weekLabel.textContent = `${fmt(parsedRange.start)} - ${fmt(parsedRange.end)}`
  } else {
    weekLabel.textContent = week.name || `Week ${currentWeek+1}`
  }
  // show the scripture/passage for the week in the header area
  weekPassage.textContent = parsedHeader.passage || ''
  daysEl.innerHTML = ''
  // If a week only has a single reading entry, show it for Mon-Fri so user can mark it 5x
  const readings = (week.days && week.days.length === 1) ? Array.from({length:5}).map(()=>week.days[0]) : week.days
  // determine which displayed index corresponds to today (Mon=0..Fri=4)
  const today = new Date()
  const dow = today.getDay() // 0=Sun,1=Mon...
  const todayIndex = (dow >= 1 && dow <= 5) ? dow - 1 : null
  const isThisWeek = (todayWeekIndex !== null && todayWeekIndex === currentWeek)
  const isPastWeek = (todayWeekIndex !== null && currentWeek < todayWeekIndex)
  const isFutureWeek = (todayWeekIndex !== null && currentWeek > todayWeekIndex)
  readings.forEach((reading, i)=>{
    const li = document.createElement('li')
    li.className = 'day'
    const meta = document.createElement('div')
    meta.className = 'meta'
    const title = document.createElement('div')
    title.className = 'title'
    title.textContent = `${['Mon','Tue','Wed','Thu','Fri'][i] || `Day ${i+1}`}`
    // per-day view should not show the scripture (it's shown in header)
    meta.appendChild(title)

    const btn = document.createElement('button')
    btn.textContent = 'Need To Read'
    const key = storageKey(currentWeek, i)
    const done = localStorage.getItem(key) === '1'
    if(done){ li.classList.add('completed'); btn.textContent = 'I Read Today' }
    // highlight today's weekday when viewing the current week
    if(isThisWeek && typeof todayIndex === 'number' && todayIndex === i){
      li.classList.add('today')
      li.setAttribute('aria-current','date')
    }

    // mute days that are in past weeks, mark future days
    if(isPastWeek) {
      li.classList.add('muted')
    } else if(isFutureWeek) {
      li.classList.add('future')
    } else if(isThisWeek && typeof todayIndex === 'number'){
      if(i < todayIndex) li.classList.add('muted')
      if(i > todayIndex) li.classList.add('future')
    }
    btn.addEventListener('click', ()=>{
      const isDone = localStorage.getItem(key) === '1'
      if(isDone){
        localStorage.removeItem(key)
        btn.textContent = 'Need To Read'
        li.classList.remove('completed')
      } else {
        localStorage.setItem(key, '1')
        btn.textContent = 'I Read Today'
        li.classList.add('completed')
      }
      updateProgress()
    })

    li.appendChild(meta)
    li.appendChild(btn)
    daysEl.appendChild(li)
  })
  updateProgress()
}

  function parseReading(reading){
    // remove a leading numeric index like "1 "
    let s = reading.replace(/^\s*\d+\s+/, '')
    // look for a date range like "Jan 01 - Jan 07" (month day - month day)
    // allow optional year after the day, e.g. "Jan 01 2026 - Jan 07 2026"
    const m = s.match(/^([A-Za-z]{3,}\s*\d{1,2}(?:\s*\d{4})?)\s*-\s*([A-Za-z]{3,}\s*\d{1,2}(?:\s*\d{4})?)\s+(.*)$/)
    if(m){
      return { date: m[1] + ' - ' + m[2], passage: m[3].trim() }
    }
    // alternative: sometimes there's a prefixed ordinal and then the date range e.g. "1 Jan 01 - Jan 07 Acts 1-5"
    const m2 = s.match(/^\d+\s+([A-Za-z]{3,}\s*\d{1,2}(?:\s*\d{4})?)\s*-\s*([A-Za-z]{3,}\s*\d{1,2}(?:\s*\d{4})?)\s+(.*)$/)
    if(m2){
      return { date: m2[1] + ' - ' + m2[2], passage: m2[3].trim() }
    }
    // fallback: try to split off a leading token that looks like a month
    const m3 = s.match(/^([A-Za-z]{3,}\s*\d{1,2}(?:\s*\d{4})?\s*-\s*[A-Za-z]{3,}\s*\d{1,2}(?:\s*\d{4})?)\s+(.*)$/)
    if(m3) return {date:m3[1], passage:m3[2].trim()}
    return {date:'', passage:reading}
  }

  function parseRangeToDates(text){
    // expects something like "Jan 01 - Jan 07" or with years "Jan 01 2026 - Jan 07 2026"
    const m = text.match(/([A-Za-z]{3,})\s*(\d{1,2})(?:\s*(\d{4}))?\s*-\s*([A-Za-z]{3,})\s*(\d{1,2})(?:\s*(\d{4}))?/) 
    if(!m) return null
    // prefer explicit years in the text; otherwise default to 2026
    const startMonth = m[1], startDay = m[2], startYear = m[3]
    const endMonth = m[4], endDay = m[5], endYear = m[6]
    const defaultYear = 2026
    const sYear = startYear ? parseInt(startYear,10) : defaultYear
    const eYear = endYear ? parseInt(endYear,10) : defaultYear
    const s1 = `${startMonth} ${startDay} ${sYear}`
    const s2 = `${endMonth} ${endDay} ${eYear}`
    const d1 = new Date(s1)
    let d2 = new Date(s2)
    // handle ranges that cross year boundary
    if(d2 < d1) d2.setFullYear(d2.getFullYear()+1)
    // Normalize to the Monday--Friday work-week that contains the range start.
    // This makes week labels show Mon-Fri (e.g. Jan 19 - Jan 23) rather than Sun-Sat.
    const start = new Date(d1)
    const day = start.getDay() // 0=Sun,1=Mon...
    // compute Monday of that week
    const monday = new Date(start)
    const deltaToMon = (day === 0) ? -6 : (1 - day)
    monday.setDate(monday.getDate() + deltaToMon)
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)
    return {start:monday, end:friday}
  }

  function findWeekForToday(plan){
    const today = new Date()
    let bestIndex = 0
    let bestDiff = Infinity
    for(let wi=0; wi<plan.weeks.length; wi++){
      const week = plan.weeks[wi]
      if(!week || !week.days || !week.days[0]) continue
      const parsed = parseReading(week.days[0])
      if(parsed.date){
        const range = parseRangeToDates(parsed.date)
        if(range){
          if(today >= range.start && today <= range.end) return wi
          const diff = Math.abs(today - range.start)
          if(diff < bestDiff){ bestDiff = diff; bestIndex = wi }
        }
      }
    }
    return bestIndex
  }

function updateProgress(){
  const week = plan.weeks[currentWeek]
  if(!week) return
  const total = (week.days && week.days.length === 1) ? 5 : week.days.length
  let done = 0
  for(let i=0;i<total;i++){ if(localStorage.getItem(storageKey(currentWeek,i))==='1') done++ }
}

prevBtn.addEventListener('click', ()=>{ if(currentWeek>0){ currentWeek--; renderWeek() } })
nextBtn.addEventListener('click', ()=>{ if(currentWeek < plan.weeks.length-1){ currentWeek++; renderWeek() } })
resetBtn.addEventListener('click', ()=>{
  if(!confirm('Reset completion for this week?')) return
  const week = plan.weeks[currentWeek]
  const total = (week.days && week.days.length === 1) ? 5 : week.days.length
  for(let i=0;i<total;i++) localStorage.removeItem(storageKey(currentWeek,i))
  renderWeek()
})

loadPlan().then(p=>{
  plan = p || {weeks:[]}
  // Detect imported plans where each "week" contains numbered weekly entries
  // like "1 Jan 01 - Jan 07 Acts 1-5", "2 Jan 08 - Jan 14 Acts 6-10".
  let needFlatten = false
  for(const w of plan.weeks){
    if(w.days && w.days.length > 1){
      const allNumbered = w.days.every(d => /^\s*\d+\s+/.test(d))
      if(allNumbered) { needFlatten = true; break }
    }
  }
  if(needFlatten){
    const flat = []
    for(const w of plan.weeks){
      for(const d of w.days){
        const cleaned = d.replace(/^\s*\d+\s*/, '').trim()
        // parse the cleaned entry to extract a full date range (including year) and passage
        const parsed = parseReading(cleaned)
        const name = parsed.date || cleaned.split(/\s+/)[0] || `Week ${flat.length+1}`
        flat.push({ name: name, days: [cleaned] })
      }
    }
    plan.weeks = flat
  }

  todayWeekIndex = findWeekForToday(plan)
  currentWeek = todayWeekIndex
  renderWeek()
})
