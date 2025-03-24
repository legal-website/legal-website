// Format date for charts
export function formatDateForChart(date: Date): string {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date)
  }
  
  // Generate monthly data for the past 6 months
  export function generateMonthlyData() {
    const data = []
    const today = new Date()
  
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(today.getMonth() - i)
  
      const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date)
      data.push({
        month,
        date: date,
        value: 0, // Default value
      })
    }
  
    return data
  }
  
  // Group data by month
  export function groupDataByMonth(data: any[], dateField: string, valueField: string) {
    const monthlyData = generateMonthlyData()
  
    // Map to quickly look up month indices
    const monthMap = new Map(monthlyData.map((item, index) => [item.month, index]))
  
    // Aggregate data by month
    data.forEach((item) => {
      const date = new Date(item[dateField])
      const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date)
  
      if (monthMap.has(month)) {
        const index = monthMap.get(month)
        if (index !== undefined) {
          monthlyData[index].value += Number(item[valueField] || 0)
        }
      }
    })
  
    return monthlyData
  }
  
  