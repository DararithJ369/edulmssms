from sqlalchemy import inspect
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine

from app.db.seed.base import BaseSeeder
from app.models.course import Module
from app.utils.colors import Colors


class ModuleSeeder(BaseSeeder):
    def __init__(self, db: Session):
        super().__init__(db, Module)

    def seed_modules(self, courses: list) -> list[Module]:
        """Seed modules for all courses"""
        if not courses:
            return []

        bind = self.db.bind
        if not isinstance(bind, Engine):
            Colors.warning("Database bind is not an Engine, skipping module seeding")
            return []
        inspector = inspect(bind)
        if "modules" not in set(inspector.get_table_names()):
            Colors.warning("Modules table does not exist, skipping")
            return []

        # Dictionary defining 5 modules for each of the 10 courses
        modules_by_course = {
            "DS-210": [
                {"title": "Relational Database Foundations & ER Modeling", "description": "Introduction to relational database principles, schema constraints, entity-relationship diagrams, and primary/foreign keys.", "order": 1},
                {"title": "Relational Schema & Table Normalization", "description": "Analyzing anomalies, functional dependencies, and normalizing database tables through 1NF, 2NF, 3NF, and BCNF.", "order": 2},
                {"title": "SQL Fundamentals", "description": "Structured Query Language basics: SELECT, WHERE, ORDER BY, GROUP BY, and aggregate functions.", "order": 3},
                {"title": "Advanced SQL Queries & Relational Joins", "description": "Mastering inner, outer, left, right joins, subqueries, set operations, and window functions.", "order": 4},
                {"title": "Database Transactions, Indexes & Tuning", "description": "ACID properties, transaction management, query execution plans, indexes, and performance optimization.", "order": 5}
            ],
            "IT-201": [
                {"title": "HTML5 Semantics, Responsive CSS3 Grid & Flexbox", "description": "Semantic markup document mapping, responsive CSS grid structures, Flexbox element alignments, and media query layouts.", "order": 1},
                {"title": "JavaScript ES6+ & DOM Interaction APIs", "description": "Object destructuring, arrow functions, event listeners, dynamic DOM manipulation, and asynchronous fetch requests.", "order": 2},
                {"title": "Single Page App Foundations with React & Tailwind", "description": "JSX rendering, components, props, React hook states (useState, useEffect), and Tailwind custom styling utilities.", "order": 3},
                {"title": "Next.js Dashboard Routing, SSR & Client Fetching", "description": "Next.js folder-based routing, server-side rendering (SSR), static site generation, and client-side data fetching.", "order": 4},
                {"title": "REST API Integration with FastAPI & Secure Sessions", "description": "FastAPI routes, request validation with Pydantic, cookie and header authorization, and database synchronization.", "order": 5}
            ],
            "DS-301": [
                {"title": "Introduction to Machine Learning & Math Essentials", "description": "Linear algebra refreshers, matrix operations, multivariate calculus gradients, and basic ML pipelines.", "order": 1},
                {"title": "Supervised Learning - Linear & Logistic Regression", "description": "Cost functions, gradient descent optimization, ordinary least squares, and binary classification models.", "order": 2},
                {"title": "Unsupervised Learning - K-Means Clustering & PCA", "description": "Partitioning cluster methods, elbow optimization, dimensional reduction, and principal component analysis.", "order": 3},
                {"title": "Decision Trees, Random Forests & Ensemble Methods", "description": "Information gain, entropy metrics, bagging, boosting, XGBoost, and ensemble decision tree classifiers.", "order": 4},
                {"title": "Neural Networks & Deep Learning Implementations", "description": "Forward and backward propagation, activation functions, multilayer perceptrons, and basic CNN models.", "order": 5}
            ],
            "SE-202": [
                {"title": "Software Lifecycle, SOLID Principles & UML Design", "description": "Software planning, analysis, single-responsibility, open-closed principles, and unified modeling language mapping.", "order": 1},
                {"title": "Creational Design Patterns", "description": "Singleton, Factory Method, Abstract Factory, Builder, and Prototype patterns.", "order": 2},
                {"title": "Structural Design Patterns", "description": "Adapter, Bridge, Composite, Decorator, Facade, Flyweight, and Proxy patterns.", "order": 3},
                {"title": "Behavioral Design Patterns", "description": "Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, and Template Method patterns.", "order": 4},
                {"title": "Enterprise Architectural Patterns & Clean Code", "description": "Layered architectures, repository patterns, microservices design, MVC frameworks, and clean code principles.", "order": 5}
            ],
            "MATH-102": [
                {"title": "Descriptive Statistics & Data Visualization", "description": "Mean, median, variance, standard deviation, box plots, histograms, and data distributions.", "order": 1},
                {"title": "Probability Theory & Discrete/Continuous Distributions", "description": "Bayes' theorem, combinatorics, binomial, Poisson, normal, and exponential distributions.", "order": 2},
                {"title": "Inferential Statistics & Hypothesis Testing", "description": "Z-tests, T-tests, chi-square tests, p-values, confidence intervals, and error types.", "order": 3},
                {"title": "Regression Analysis & Correlation Coefficients", "description": "Pearson correlation, simple linear regression, coefficient estimation, and residuals analysis.", "order": 4},
                {"title": "Statistical Modelling & Experimental Design", "description": "ANOVA models, sample size calculations, multi-factor analysis, and experimental parameters.", "order": 5}
            ],
            "CS-301": [
                {"title": "OS Principles, Kernels, & Process Management", "description": "System calls, kernel space, context switching, processes, threads, and CPU scheduling.", "order": 1},
                {"title": "Linux Command Line & File System Navigation", "description": "BASH command shell, directories, permissions, piping, grep filtering, and text manipulation.", "order": 2},
                {"title": "Shell Scripting & Task Automation", "description": "Variables, conditionals, loops, functions, arguments, and cron tab task scheduling in BASH.", "order": 3},
                {"title": "Memory Management, Concurrency & Deadlocks", "description": "Virtual memory, paging, allocation, mutexes, semaphores, and deadlock prevention.", "order": 4},
                {"title": "System Administration, Networking & Security", "description": "User administration, systemctl processes, firewall rules, iptables, SSH, and secure shell setups.", "order": 5}
            ],
            "IT-301": [
                {"title": "OSI Model, TCP/IP Layers & Network Protocols", "description": "Layer descriptions, packet encapsulation, headers, and protocol analysis (ARP, IP, TCP, UDP).", "order": 1},
                {"title": "Routing Protocols & LAN/WAN Architecture", "description": "IP subnetting, static routing, OSPF, BGP, LAN switching, VLANs, and trunking ports.", "order": 2},
                {"title": "Wireless Networks & Network Configurations", "description": "IEEE 802.11 standards, access point parameters, DHCP setups, and DNS server mapping.", "order": 3},
                {"title": "Network Security, Firewalls & Cryptography", "description": "SSL/TLS handshakes, VPN tunneling, packet filtering firewalls, and encryption algorithms.", "order": 4},
                {"title": "Network Troubleshooting & Performance Tuning", "description": "Wireshark sniffing, traceroute diagnostics, ping latency analysis, and bandwidth tuning.", "order": 5}
            ],
            "CS-201": [
                {"title": "Big O Notation, Array & Linked List Implementations", "description": "Time/space complexity formulas, dynamic arrays, singly, doubly, and circular linked lists.", "order": 1},
                {"title": "Stacks, Queues & Double-Ended Queues", "description": "LIFO/FIFO structures, array and list queue implementations, and priority queue sorting.", "order": 2},
                {"title": "Binary Trees, BSTs & AVL Trees", "description": "Tree traversals (in/pre/post-order), binary search trees, and self-balancing AVL algorithms.", "order": 3},
                {"title": "Hash Tables & Hash Collision Resolution Strategies", "description": "Hash function designs, chaining with lists, open addressing, and linear probing methods.", "order": 4},
                {"title": "Graph Representation & Pathfinding Algorithms", "description": "Adjacency matrices, lists, BFS/DFS traversals, and Dijkstra's shortest path algorithms.", "order": 5}
            ],
            "SE-301": [
                {"title": "Agile Manifesto, Scrum Roles & Ceremonies", "description": "Agile principles, scrum master, product owner, developer roles, sprint planning, and standups.", "order": 1},
                {"title": "Product Backlogs, User Stories & Estimation", "description": "Feature backlog definitions, user stories, story points, Fibonacci estimates, and sprint boards.", "order": 2},
                {"title": "Sprints, Daily Standups & Retrospectives", "description": "Conducting active sprints, 15-minute daily standup updates, burndown charts, and retrospectives.", "order": 3},
                {"title": "Version Control (Git) & CI/CD Pipelines", "description": "Git branch merges, pull requests, resolving conflicts, and building automated GitHub Actions.", "order": 4},
                {"title": "Release Management & Customer Feedback Loops", "description": "Software deployment guidelines, beta feedback cycles, bug tracking, and incremental rollouts.", "order": 5}
            ],
            "CS-101": [
                {"title": "Python Setup, Syntax, Variables & Operators", "description": "Installing interpreter, virtual environments, variables, data types, and arithmetic operations.", "order": 1},
                {"title": "Control Flow - Decisions & Loops", "description": "Conditional flow statements (if/elif/else), for iterations, while loops, and loop control.", "order": 2},
                {"title": "Data Structures - Lists, Tuples, Dictionaries & Sets", "description": "Python list slicing, tuple immutability, dictionary hashes, and unique set operations.", "order": 3},
                {"title": "Reusable Code - Functions & Modules", "description": "Defining functions, positional/keyword arguments, return statements, and importing packages.", "order": 4},
                {"title": "Error Handling, File IO & Unit Testing", "description": "Try/except statement containment blocks, reading/writing local files, and basic unit testing.", "order": 5}
            ]
        }

        modules = []
        for course in courses:
            course_id = course.id
            course_code = course.course_code
            
            data_list = modules_by_course.get(course_code, [
                {"title": "Course Introduction", "description": "Basic introduction to course topics.", "order": 1},
                {"title": "Core Methodology", "description": "Deep dive into main subjects.", "order": 2},
                {"title": "Practical Work", "description": "Hands-on projects and exercises.", "order": 3},
                {"title": "Advanced Topics", "description": "Advanced theories and workflows.", "order": 4},
                {"title": "Final Review", "description": "Review session and preparation for exams.", "order": 5}
            ])

            for data in data_list:
                existing = self.db.query(Module).filter_by(title=data["title"], course_id=course_id).first()
                if existing:
                    modules.append(existing)
                    continue

                module = Module(
                    title=data["title"],
                    description=data["description"],
                    order=data["order"],
                    course_id=course_id
                )
                self.db.add(module)
                modules.append(module)

        try:
            self.db.commit()
            Colors.success(f"✓ {len(modules)} module(s) seeded")
        except Exception as e:
            self.db.rollback()
            Colors.error(f"✗ Error seeding modules: {e}")
            return []

        return modules
