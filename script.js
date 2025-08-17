document.addEventListener('DOMContentLoaded', () => {
    // Get all necessary DOM elements
    const form = document.getElementById('studyPlanForm');
    const addExamBtn = document.getElementById('addExamBtn');
    const showPreviousBtn = document.getElementById('showPreviousBtn');
    const planList = document.getElementById('planList');
    const flowchartArea = document.getElementById('flowchartArea');
    const flowchartPlaceholder = document.getElementById('flowchartPlaceholder');
    const plansSection = document.getElementById('plans-section');

    // Load any saved plans on page load
    loadPreviousPlans();

    // Event listener for the "Add Exam" button
    addExamBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // Get form values and validate
        const examName = document.getElementById('examName').value.trim();
        const examDate = document.getElementById('examDate').value;
        const studyTopics = document.getElementById('studyTopics').value.split(',').map(topic => topic.trim()).filter(topic => topic);
        const subTopics = document.getElementById('subTopics').value.split(',').map(topic => topic.trim()).filter(topic => topic);
        const timePerTopicHours = parseInt(document.getElementById('timePerTopicHours').value) || 0;
        const timePerTopicMinutes = parseInt(document.getElementById('timePerTopicMinutes').value) || 0;
        const timePerSubTopicHours = parseInt(document.getElementById('timePerSubTopicHours').value) || 0;
        const timePerSubTopicMinutes = parseInt(document.getElementById('timePerSubTopicMinutes').value) || 0;

        // Basic validation to ensure required fields are filled
        if (!examName || !examDate || studyTopics.length === 0) {
            console.error('Validation failed: Please fill in Exam Name, Exam Date, and at least one Study Topic.');
            return;
        }

        // Create the study plan object
        const newPlan = {
            id: Date.now(),
            examName,
            examDate,
            studyTopics,
            subTopics,
            timePerTopic: { hours: timePerTopicHours, minutes: timePerTopicMinutes },
            timePerSubTopic: { hours: timePerSubTopicHours, minutes: timePerSubTopicMinutes }
        };

        // Save the plan to local storage
        savePlan(newPlan);

        // Display the new plan and draw the flowchart
        displayPlan(newPlan);
        drawFlowchart(newPlan);

        // Clear the form for a new entry
        form.reset();
    });

    // Event listener for the "Show Previous Plans" button
    showPreviousBtn.addEventListener('click', () => {
        // Toggle the visibility of the plan list
        plansSection.classList.toggle('hidden-section');
    });

    // Function to save a plan to local storage
    function savePlan(plan) {
        try {
            let plans = JSON.parse(localStorage.getItem('studyPlans')) || [];
            plans.push(plan);
            localStorage.setItem('studyPlans', JSON.stringify(plans));
        } catch (e) {
            console.error('Error saving to local storage:', e);
        }
    }

    // Function to load and display previous plans
    function loadPreviousPlans() {
        try {
            const plans = JSON.parse(localStorage.getItem('studyPlans')) || [];
            planList.innerHTML = '';
            if (plans.length > 0) {
                plans.forEach(plan => displayPlan(plan));
                plansSection.classList.add('hidden-section'); // Initially hide the list
            } else {
                planList.innerHTML = '<p style="text-align:center; color: #bdc3c7; margin-top: 1rem;">No previous plans found.</p>';
            }
        } catch (e) {
            console.error('Error loading from local storage:', e);
            planList.innerHTML = '<p style="text-align:center; color: #bdc3c7; margin-top: 1rem;">Error loading previous plans.</p>';
        }
    }

    // Function to display a single plan in the UI
    function displayPlan(plan) {
        const remainingDays = calculateRemainingDays(plan.examDate);
        const timeTopicStr = formatTime(plan.timePerTopic);
        const timeSubTopicStr = formatTime(plan.timePerSubTopic);

        const planCard = document.createElement('div');
        planCard.className = 'plan-card';
        planCard.innerHTML = `
            <div class="plan-card-header">
                <h3>${plan.examName}</h3>
                <div class="action-buttons">
                    <button data-id="${plan.id}" class="select-btn" title="View Flowchart">
                         <i class="fas fa-eye"></i>
                    </button>
                    <button data-id="${plan.id}" class="delete-btn" title="Delete Plan">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="plan-card-body">
                <p><i class="fas fa-calendar-alt"></i><b>Date:</b> ${plan.examDate} (${remainingDays} days left)</p>
                <p><i class="fas fa-book-open"></i><b>Topics:</b> ${plan.studyTopics.join(', ')}</p>
            </div>
        `;
        planList.prepend(planCard);

        // Add event listeners for the new buttons
        planCard.querySelector('.delete-btn').addEventListener('click', (e) => {
            const idToDelete = parseInt(e.currentTarget.dataset.id);
            // No confirmation dialog as per instructions
            deletePlan(idToDelete);
        });

        planCard.querySelector('.select-btn').addEventListener('click', (e) => {
            const idToView = parseInt(e.currentTarget.dataset.id);
            const plans = JSON.parse(localStorage.getItem('studyPlans')) || [];
            const selectedPlan = plans.find(p => p.id === idToView);
            if (selectedPlan) {
                drawFlowchart(selectedPlan);
            }
        });
    }

    // Function to delete a plan from local storage
    function deletePlan(id) {
        let plans = JSON.parse(localStorage.getItem('studyPlans')) || [];
        plans = plans.filter(plan => plan.id !== id);
        localStorage.setItem('studyPlans', JSON.stringify(plans));
        planList.innerHTML = ''; // Clear and reload the list
        loadPreviousPlans();
    }

    // Helper function to calculate remaining days
    function calculateRemainingDays(examDate) {
        const today = new Date();
        const exam = new Date(examDate);
        const diffTime = exam.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }

    // Helper function to format time strings
    function formatTime(time) {
        const hoursStr = time.hours > 0 ? `${time.hours}h` : '';
        const minutesStr = time.minutes > 0 ? `${time.minutes}m` : '';
        return `${hoursStr} ${minutesStr}`.trim() || 'Not specified';
    }

    // The core function to draw the flowchart using HTML divs
    function drawFlowchart(plan) {
        // Clear the flowchart area first
        flowchartArea.innerHTML = '';

        // Hide the placeholder text and set the class for proper content display
        if (flowchartPlaceholder) {
            flowchartPlaceholder.style.display = 'none';
        }
        flowchartArea.classList.add('has-content');

        // Create the main container for the flowchart
        const container = document.createElement('div');
        container.className = 'flowchart-container';

        // Add a "Start" node at the beginning of the flow
        const startNode = document.createElement('div');
        startNode.className = 'flowchart-node start-node';
        startNode.textContent = 'Start';
        container.appendChild(startNode);

        // Create and style the Exam node
        const examNode = document.createElement('div');
        examNode.className = 'flowchart-node exam-node';
        const remainingDays = calculateRemainingDays(plan.examDate);
        examNode.innerHTML = `
            <div class="exam-title">${plan.examName}</div>
            <div class="exam-info">
                Date: ${plan.examDate}<br>
                (${remainingDays} days to go!)
            </div>
        `;
        container.appendChild(examNode);

        // Create and style the Topics section
        const topicsSection = document.createElement('div');
        topicsSection.innerHTML = '<h3 class="section-heading">Topics</h3>';
        const topicsContainer = document.createElement('div');
        topicsContainer.className = 'topics-container';
        const timePerTopicStr = formatTime(plan.timePerTopic);

        // Loop through each topic and create a node
        plan.studyTopics.forEach(topic => {
            const topicNode = document.createElement('div');
            topicNode.className = 'flowchart-node topic-node';
            topicNode.innerHTML = `
                <div>${topic}</div>
                ${timePerTopicStr !== 'Not specified' ? `<span class="timing-info">${timePerTopicStr}</span>` : ''}
            `;
            topicsContainer.appendChild(topicNode);
        });

        topicsSection.appendChild(topicsContainer);
        container.appendChild(topicsSection);


        // Create and style the Sub-topics section
        if (plan.subTopics.length > 0) {
            const subTopicsSection = document.createElement('div');
            subTopicsSection.innerHTML = '<h3 class="section-heading">Sub-topics</h3>';
            const subTopicsContainer = document.createElement('div');
            subTopicsContainer.className = 'subtopics-container';
            const timePerSubTopicStr = formatTime(plan.timePerSubTopic);

            // Loop through each sub-topic and create a node
            plan.subTopics.forEach(subTopic => {
                const subTopicNode = document.createElement('div');
                subTopicNode.className = 'flowchart-node subtopic-node';
                subTopicNode.innerHTML = `
                    <div>${subTopic}</div>
                    ${timePerSubTopicStr !== 'Not specified' ? `<span class="timing-info">${timePerSubTopicStr}</span>` : ''}
                `;
                subTopicsContainer.appendChild(subTopicNode);
            });

            subTopicsSection.appendChild(subTopicsContainer);
            container.appendChild(subTopicsSection);
        }

        // Add an "End" node at the end of the flow
        const endNode = document.createElement('div');
        endNode.className = 'flowchart-node end-node';
        endNode.textContent = 'End';
        container.appendChild(endNode);

        // Append the whole flowchart structure to the main area
        flowchartArea.appendChild(container);
    }
});
