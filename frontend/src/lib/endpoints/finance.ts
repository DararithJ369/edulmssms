export const FINANCE = {
    GET_ALL: "/finance",
    CREATE: "/finance",
    GET_BY_ID: (financeId: string) => `/finance/${financeId}`,
    UPDATE: (financeId: string) => `/finance/${financeId}`,
    DELETE: (financeId: string) => `/finance/${financeId}`,
    FEES: "finance/fees",
    FEES_BY_ID: (feeId: string) => `/finance/fees/${feeId}`,
    EXPENSES: "finance/expenses",
    EXPENSES_BY_ID: (expenseId: string) => `/finance/expenses/${expenseId}`,
    SALARY: "finance/salary",
    SALARY_BY_ID: (salaryId: string) => `/finance/salary/${salaryId}`,
} as const;