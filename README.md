# NDN Executive Dashboard

thinking face Project Overview
We want to give the Executive Team full visibility into company performance across both manufacturing and web development operations.
The goal is to consolidate financials, project progress, and workload data into a single, high-level dashboard—pulled directly from JIRA.

This dashboard will provide a top-down view of Orders, Revenue, Commissions, Customer Activity, and Internal Projects, allowing leadership to make informed decisions and track performance at a glance.

Data Sources:

Contract Manufacturing Project: All customer Orders, Financials, Agents

Web Development Project: All internal projects and tasks, tracked by Epic

direct hit Scope
Must have:

Financial and operational metrics aggregated from JIRA

Visualization of Orders and Financials, Searchable by Customer.  

Tracking internal project progress from Web Development Epics

Executive view accessible via Admin Panel (to SK, Rachel, Tiffany, Naomi to start)

Filters by date range, customer, project type, and assigned team members

Nice to have:

Export options (CSV or PDF summary)

Not in scope:

Historical data prior to Nov 1, 2025

Manual financial entry or adjustment (all data pulled directly from JIRA)

Time tracking / Estimates on Web Dev in Jira (this would be a phase 2, as we’d have to change the way we’re working in Jira to get this info)

Any info from a source outside of Jira (ie: Shopify)

Considering for Phase 2

Comparison reports (Month-over-Month, Quarter-over-Quarter)

Integration with Brevo for automated reporting

Alerts (ie: for overdue projects/orders)

Open Questions:

How often do we need sync? Real time / every hour / daily
Monday to Friday, 7:30 - 6:30 CST hourly 

How deep do you want details?  I would think high level only as Agent and Customer Dashboards will be available for details.
High level data, but we do need to pull in if something is Off Track and missing targets.  

What timeline do we want to show for financials?  Current Month?  Last month? November 1, 2025 and forward

spiral calendar Timeline - TBC and prioritized
Project Approval with SK - Nov 17, 2025
Project Kickoff with Dev Team - 
Dev complete - 
Naomi / QA Sign off - 
SK Review - 
Adjustments after SK Review - 
QA Sign Off - 


triangular flag Milestones and deadlines
WEB-1105: P1 - Executive Dashboard (CM)
In Requirements
 
WEB-1106: P2 - Executive Dashboard 
Open
 

 

User Stories

As an Executive, I want a dashboard where I can view:
Total Orders and Sales data (from Contract Manufacturing)

Order Pipeline and Fulfillment Progress

How many orders are in progress?  How many were completed last month? 

What are the Orders in Progress, and at what quantity?

Agent Commission Totals and Upcoming Payouts

Web Development Project Status by Epic (Active, On Hold, Complete)

Internal team workload and task completion metrics

The average order completion time for any number of orders with options like date range, customer

Where is there an issue, and what do I need to pay attention to in order to fix that issue

ie: Delay in an order - where is it delayed?  

Delay in a label - is it delayed at print, QC, Design? 

List of Orders with Order Health of “At Risk” or “Off Track” 

Expected Cash Flow 

Key Features and Requirements:
Feature

Requirements

Notes

Feature

Requirements

Notes

Executive Summary (Top-Level View)
Top section of the dashboard should summarize:

Total Active Customers

Total Active Orders

Total Monthly Revenue

Total Outstanding Payments

Total Commissions Due (next payment cycle)

Total Active Internal Projects

% of Active Orders with Order Health = On Track, At Risk, Off Track 

 

 

Expected Cash Flow
Show All Customers, but ability to filter per customer

When a specific customer is selected, show if the “Agent” Field != Empty

Sum of all active Orders (Remaining Due) 

Searchable by Date (will be based off the EST Ship Date of the Order)

Idea is that I want to know how much money is coming in by a specific date in the future.  

Data Sources:

Order Total

Deposit Amount

Final Payment

Remaining Due

EST Ship Date

Customer

Agent

Needs Attention Section
Order Health off Track  (CM)
(List of all Orders with Order Health = At Risk, and Off Track) 

Based on Logic from Order Status Tab

Customer

Product Name

Sales Order #

Start Date

Current Status

Expected Status

Days behind schedule

EST Ship Date

Due Date

Order Notes (Expandable)

Quantity Ordered

Label Off Track

Label Order Date

Design Due Date

Current Status

Days in Current Status

Date Order is expected to go to Packaging 

How many days required for Print

D&D Projects Off track

Start Date

Due Date

% Of Subtasks completed


 

Label Off Track needs to be scoped out in JIRA

Financial Orders Overview (From Contract Manufacturing)
Total Revenue (sum of all orders with final payment received)

Open Orders Total (sum of orders not yet marked complete)

Commissions Owed (from Agent Commission fields)

Commissions Paid (based on Commission Paid Date)

Revenue by Customer

Average Order Completion Time (filter by Customer, use “Days In Production” field)

List of White Label Orders per Customer with total Remaining Inventory

Revenue by Month / Quarter

Top 5 Customers by Total Order Totals

 

Data Sources:

Start Date

Due Date

Order Total

Final Payment Received Date

Deposit Amount

Final Payment

Commission %

Commission Paid

Commission Due

Customer

Agent (if applicable)

Days in Production

Web Development Overview
All Active Epics (Projects)

Epic Status: 

# of Tasks per Epic

% Not Started, % In Progress, % Complete per Epic 

Assignee Overview: number of open tasks per team member

Recent Completions: Tasks moved to a Complete Status in last 30 days.

 

Data Sources: 

Tickets under each Epic

Status

Assignee

Dashboard Requirements

Password protected, accessible through Admin Panel for Users given access only

Not SEO discoverable or public

Filter options:

Date range

Customer

Agent

Project

Account Manager

Export or Print Summary options (nice to have)

Section Navigation:

Financial Overview

Operations (Orders)

Agent Commissions

Web Development Projects

Team Workload

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://exec-pulse-22.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f6650c32-f16a-4bdc-a47a-d09e44048827).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
