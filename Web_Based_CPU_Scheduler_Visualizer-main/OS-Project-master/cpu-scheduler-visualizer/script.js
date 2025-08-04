let processes = [];

function addProcess() {
  const id = prompt("Enter Process ID (e.g. P1):");
  const arrival = parseInt(prompt("Enter Arrival Time:"));
  const burst = parseInt(prompt("Enter Burst Time:"));
  if (!id || isNaN(arrival) || isNaN(burst)) return;

  processes.push({ id, arrival, burst, remaining: burst });
  const row = document.createElement("tr");
  row.innerHTML = `<td>${id}</td><td>${arrival}</td><td>${burst}</td>`;
  document.getElementById("process-table").appendChild(row);
}

document.getElementById("input-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const algo = document.getElementById("algorithm").value;
  const quantum = parseInt(document.getElementById("quantum").value);
  runScheduler(algo, quantum);
});

function runScheduler(algo, quantum) {
  document.getElementById("gantt").innerHTML = '';
  document.getElementById("results").innerHTML = '';

  let gantt = [];
  let time = 0;
  const n = processes.length;
  const procCopy = JSON.parse(JSON.stringify(processes));
  procCopy.sort((a, b) => a.arrival - b.arrival);

  if (algo === "FCFS") {
    for (let i = 0; i < n; i++) {
      let p = procCopy[i];
      if (time < p.arrival) time = p.arrival;
      for (let j = 0; j < p.burst; j++) {
        gantt.push(p.id);
        time++;
      }
      p.finish = time;
      p.turnaround = time - p.arrival;
      p.waiting = p.turnaround - p.burst;
    }
  }

  else if (algo === "SRTF") {
    let complete = 0;
    let ready = [];
    while (complete < n) {
      // Add all arrived processes
      procCopy.forEach(p => {
        if (p.arrival <= time && p.remaining > 0 && !ready.includes(p)) {
          ready.push(p);
        }
      });

      // Pick shortest remaining time
      ready.sort((a, b) => {
        if (a.remaining === b.remaining)
          return a.arrival - b.arrival;
        return a.remaining - b.remaining;
      });

      if (ready.length === 0) {
        gantt.push("_");
        time++;
        continue;
      }

      let curr = ready[0];
      curr.remaining--;
      gantt.push(curr.id);

      if (curr.remaining === 0) {
        curr.finish = time + 1;
        curr.turnaround = curr.finish - curr.arrival;
        curr.waiting = curr.turnaround - curr.burst;
        complete++;
        ready = ready.filter(p => p.remaining > 0);
      }

      time++;
    }
  }

  else if (algo === "RR") {
    let queue = [];
    let index = 0;
    procCopy.forEach(p => p.remaining = p.burst);
    while (index < n || queue.length > 0) {
      // Enqueue all arrived
      while (index < n && procCopy[index].arrival <= time) {
        queue.push(procCopy[index]);
        index++;
      }

      if (queue.length === 0) {
        gantt.push("_");
        time++;
        continue;
      }

      let curr = queue.shift();
      let run = Math.min(quantum, curr.remaining);
      for (let i = 0; i < run; i++) {
        gantt.push(curr.id);
        time++;
        // check if new processes arrived during this run
        while (index < n && procCopy[index].arrival <= time) {
          queue.push(procCopy[index]);
          index++;
        }
      }
      curr.remaining -= run;

      if (curr.remaining > 0) {
        queue.push(curr);
      } else {
        curr.finish = time;
        curr.turnaround = curr.finish - curr.arrival;
        curr.waiting = curr.turnaround - curr.burst;
      }
    }
  }

  // Render Gantt Chart
  gantt.forEach(id => {
    const div = document.createElement("div");
    div.className = "gantt-cell";
    div.innerText = id;
    document.getElementById("gantt").appendChild(div);
  });

  // Render Table
  const resultDiv = document.getElementById("results");
  let html = `<h3>Results</h3><table border="1"><tr><th>ID</th><th>Finish</th><th>Waiting</th><th>Turnaround</th></tr>`;
  procCopy.forEach(p => {
    html += `<tr><td>${p.id}</td><td>${p.finish ?? "-"}</td><td>${p.waiting ?? "-"}</td><td>${p.turnaround ?? "-"}</td></tr>`;
  });
  html += "</table>";
  resultDiv.innerHTML = html;
}
