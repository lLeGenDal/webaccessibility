import json

def calculate_ita_index(automated_issues, manual_issues):
    """
    Вычисляет Индекс технической доступности (ITA) по 5-балльной шкале.
    
    automated_issues: список словарей с автоматическими ошибками
    manual_issues: список словарей с ручными проверками (только подтвержденные)
    """
    base_score = 5.0
    total_deduction = 0
    
    # Веса серьезности ошибок
    severity_weights = {
        "Critical": 0.5,
        "High": 0.3,
        "Medium": 0.1,
        "Low": 0.05
    }
    
    # Веса приоритетов (WCAG Levels)
    # Приоритет 1 (A), Приоритет 2 (AA), Приоритет 3 (AAA)
    priority_multipliers = {
        "1": 1.5, # Level A
        "2": 1.0, # Level AA
        "3": 0.5  # Level AAA
    }
    
    all_issues = automated_issues + manual_issues
    
    for issue in all_issues:
        # Пропускаем отклоненные ручные проверки
        if issue.get("status") == "Rejected":
            continue
            
        severity = issue.get("severity", "Medium")
        priority = str(issue.get("priority", "2")) # По умолчанию AA
        
        weight = severity_weights.get(severity, 0.1)
        multiplier = priority_multipliers.get(priority, 1.0)
        
        total_deduction += weight * multiplier
        
    ita_index = max(1.0, base_score - total_deduction)
    
    # Определение уровня зрелости
    maturity_levels = [
        (4.5, "Optimized (Оптимизированный)"),
        (3.5, "Integrated (Интегрированный)"),
        (2.5, "Defined (Определенный)"),
        (1.5, "Initial (Начальный)"),
        (0.0, "Inactive (Неактивный)")
    ]
    
    level_name = "Inactive"
    for threshold, name in maturity_levels:
        if ita_index >= threshold:
            level_name = name
            break
            
    return {
        "ita_index": round(ita_index, 2),
        "maturity_level": level_name,
        "total_issues": len(all_issues)
    }

# Пример использования:
if __name__ == "__main__":
    auto = [
        {"severity": "Critical", "priority": "1"},
        {"severity": "High", "priority": "1"}
    ]
    manual = [
        {"severity": "Medium", "priority": "2", "status": "Confirmed"}
    ]
    
    result = calculate_ita_index(auto, manual)
    print(f"ITA Index: {result['ita_index']}")
    print(f"Maturity Level: {result['maturity_level']}")
