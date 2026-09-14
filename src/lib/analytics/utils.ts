
export const getDate = (sub: number = 0): string => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - sub)

    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}
