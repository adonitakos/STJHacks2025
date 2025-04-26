def cubic_complexity(n):
    count = 0
    for i in range(n):
        for j in range(n):
            for k in range(n):
                count += (i + j + k) % 7
    return count

n = 300  # WARNING: 300³ = 27,000,000 iterations!
result = cubic_complexity(n)
print(result)