#!/usr/bin/env python3
"""
Create a Gantt chart similar to CB20114 format
Shows project timeline with weekends and holidays
"""

from datetime import datetime, timedelta
import calendar

def get_weekends_and_holidays(start_date, end_date):
    """Get list of weekends and Malaysian public holidays"""
    weekends = []
    holidays = []
    current = start_date
    
    # Malaysian public holidays 2025-2026
    malaysian_holidays_2025 = [
        (1, 1),   # New Year
        (1, 28),  # Chinese New Year
        (1, 29),  # Chinese New Year
        (5, 1),   # Labour Day
        (5, 22),  # Wesak Day
        (6, 6),   # Agong's Birthday
        (8, 31),  # National Day
        (9, 16),  # Malaysia Day
        (10, 6),  # Deepavali
        (12, 25), # Christmas
    ]
    
    malaysian_holidays_2026 = [
        (1, 1),   # New Year
        (2, 10),  # Chinese New Year
        (2, 11),  # Chinese New Year
        (5, 1),   # Labour Day
        (5, 3),   # Wesak Day
        (6, 6),   # Agong's Birthday
        (8, 31),  # National Day
        (9, 16),  # Malaysia Day
        (10, 24), # Deepavali
        (12, 25), # Christmas
    ]
    
    all_holidays = [(2025, m, d) for m, d in malaysian_holidays_2025] + \
                   [(2026, m, d) for m, d in malaysian_holidays_2026]
    
    while current <= end_date:
        # Check if weekend (Saturday = 5, Sunday = 6)
        if current.weekday() >= 5:
            weekends.append(current)
        
        # Check if holiday
        if (current.year, current.month, current.day) in all_holidays:
            holidays.append(current)
        
        current += timedelta(days=1)
    
    return weekends, holidays

def create_gantt_chart_html():
    """Create HTML Gantt chart"""
    
    # Project timeline: September 17, 2025 - March 4, 2026
    start_date = datetime(2025, 9, 17)
    end_date = datetime(2026, 3, 4)
    
    # Get weekends and holidays
    weekends, holidays = get_weekends_and_holidays(start_date, end_date)
    
    # Define tasks with their dates - matching project phases
    tasks = [
        {
            'name': 'Project Kick-off',
            'start': datetime(2025, 9, 17),
            'end': datetime(2025, 9, 18),
            'color': '#FFD700'  # Yellow
        },
        {
            'name': 'Business Requirement',
            'start': datetime(2025, 9, 17),
            'end': datetime(2025, 10, 1),
            'color': '#90EE90'  # Light green
        },
        {
            'name': 'Project Development',
            'start': datetime(2025, 10, 2),
            'end': datetime(2025, 11, 26),
            'color': '#87CEEB',  # Light blue (parent)
            'subtasks': [
                {
                    'name': 'Backend Development (Node.js/Express)',
                    'start': datetime(2025, 10, 2),
                    'end': datetime(2025, 11, 26),
                    'color': '#228B22'  # Dark green
                },
                {
                    'name': 'Frontend Development (React)',
                    'start': datetime(2025, 10, 2),
                    'end': datetime(2025, 11, 26),
                    'color': '#87CEEB'  # Light blue
                }
            ]
        },
        {
            'name': 'Initial/Integration Testing',
            'start': datetime(2025, 11, 27),
            'end': datetime(2025, 12, 1),
            'color': '#4169E1'  # Dark blue
        },
        {
            'name': 'UA Testing',
            'start': datetime(2025, 12, 2),
            'end': datetime(2025, 12, 15),
            'color': '#4169E1'  # Dark blue
        },
        {
            'name': 'Deployment',
            'start': datetime(2025, 12, 15),
            'end': datetime(2025, 12, 31),
            'color': '#9370DB'  # Purple
        },
        {
            'name': 'Documentation',
            'start': datetime(2026, 1, 1),
            'end': datetime(2026, 3, 4),
            'color': '#FFA07A'  # Light orange/peach
        }
    ]
    
    # Generate all dates in the range
    all_dates = []
    current = start_date
    while current <= end_date:
        all_dates.append(current)
        current += timedelta(days=1)
    
    # Group dates by month
    months_data = {}
    for date in all_dates:
        month_key = date.strftime("%b'%y")
        if month_key not in months_data:
            months_data[month_key] = []
        months_data[month_key].append(date)
    
    # Create HTML
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gantt Chart - MyMasjidApp Project</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 20px;
            background: white;
        }
        .gantt-container {
            overflow-x: auto;
            border: 1px solid #000;
        }
        .gantt-table {
            border-collapse: collapse;
            width: 100%;
            min-width: 2000px;
        }
        .gantt-table th,
        .gantt-table td {
            border: 1px solid #ccc;
            padding: 4px;
            text-align: center;
            font-size: 10pt;
        }
        .gantt-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .task-cell {
            text-align: left;
            padding-left: 8px;
            font-weight: bold;
        }
        .weekend {
            background-color: #D3D3D3 !important; /* Grey */
        }
        .holiday {
            background-color: #FF6B6B !important; /* Red */
        }
        .task-bar {
            height: 20px;
            border-radius: 2px;
            position: relative;
        }
        .legend {
            margin: 20px 0;
            padding: 10px;
            border: 1px solid #000;
            background-color: #f9f9f9;
        }
        .legend-item {
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 5px;
        }
        .legend-color {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 1px solid #000;
            vertical-align: middle;
            margin-right: 5px;
        }
        .month-header {
            background-color: #e0e0e0 !important;
            font-weight: bold;
        }
        .date-header {
            font-size: 9pt;
        }
    </style>
</head>
<body>
    <h2 style="text-align: center;">Figure 2: Gantt Chart</h2>
    <h3 style="text-align: center;">MyMasjidApp Development Timeline</h3>
    
    <div class="legend">
        <strong>Legend:</strong>
        <span class="legend-item">
            <span class="legend-color" style="background-color: #D3D3D3;"></span>
            Weekend
        </span>
        <span class="legend-item">
            <span class="legend-color" style="background-color: #FF6B6B;"></span>
            Bank Holiday
        </span>
        <span class="legend-item">
            <span class="legend-color" style="background-color: #FFD700;"></span>
            Project Kick-off
        </span>
        <span class="legend-item">
            <span class="legend-color" style="background-color: #90EE90;"></span>
            Business Requirement
        </span>
        <span class="legend-item">
            <span class="legend-color" style="background-color: #228B22;"></span>
            Backend Development
        </span>
        <span class="legend-item">
            <span class="legend-color" style="background-color: #87CEEB;"></span>
            Frontend Development
        </span>
        <span class="legend-item">
            <span class="legend-color" style="background-color: #4169E1;"></span>
            Testing
        </span>
        <span class="legend-item">
            <span class="legend-color" style="background-color: #9370DB;"></span>
            Deployment
        </span>
        <span class="legend-item">
            <span class="legend-color" style="background-color: #FFA07A;"></span>
            Documentation
        </span>
    </div>
    
    <div class="gantt-container">
        <table class="gantt-table">
            <thead>
                <tr>
                    <th style="width: 200px;">Task</th>"""
    
    # Add month headers
    for month_key, dates in months_data.items():
        colspan = len(dates)
        html += f'<th colspan="{colspan}" class="month-header">{month_key}</th>'
    
    html += """
                </tr>
                <tr>
                    <th>Task Name</th>"""
    
    # Add date headers
    for date in all_dates:
        day = date.strftime("%d")
        html += f'<th class="date-header">{day}</th>'
    
    html += """
                </tr>
            </thead>
            <tbody>"""
    
    # Add tasks
    for task in tasks:
        html += f'<tr><td class="task-cell">{task["name"]}</td>'
        
        for date in all_dates:
            cell_class = ""
            cell_bg = ""
            
            # Check if weekend
            if date in weekends:
                cell_class = "weekend"
            # Check if holiday
            elif date in holidays:
                cell_class = "holiday"
            # Check if task date
            elif task["start"] <= date <= task["end"]:
                cell_bg = f'background-color: {task["color"]};'
            
            html += f'<td class="{cell_class}" style="{cell_bg}"></td>'
        
        html += '</tr>'
        
        # Add subtasks if any
        if 'subtasks' in task:
            for subtask in task['subtasks']:
                html += f'<tr><td class="task-cell" style="padding-left: 30px;">{subtask["name"]}</td>'
                
                for date in all_dates:
                    cell_class = ""
                    cell_bg = ""
                    
                    if date in weekends:
                        cell_class = "weekend"
                    elif date in holidays:
                        cell_class = "holiday"
                    elif subtask["start"] <= date <= subtask["end"]:
                        cell_bg = f'background-color: {subtask["color"]};'
                    
                    html += f'<td class="{cell_class}" style="{cell_bg}"></td>'
                
                html += '</tr>'
    
    html += """
            </tbody>
        </table>
    </div>
    
    <p style="margin-top: 20px; font-size: 10pt;">
        <strong>Note:</strong> This Gantt chart shows the development timeline for MyMasjidApp project.
        Deployment is scheduled for mid to end December 2025.
    </p>
</body>
</html>"""
    
    # Save HTML file
    with open('GANTT_CHART.html', 'w', encoding='utf-8') as f:
        f.write(html)
    
    print("✓ Gantt chart created: GANTT_CHART.html")
    print("  Open the HTML file in a web browser to view the chart")
    print("  You can take a screenshot or print to PDF for inclusion in the report")

if __name__ == '__main__':
    create_gantt_chart_html()

