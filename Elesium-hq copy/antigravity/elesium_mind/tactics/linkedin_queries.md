# 🔍 RapidAPI LinkedIn Search Queries

All queries use `google-search74.p.rapidapi.com` to find LinkedIn profiles by role and company.

---

### Clinic Managers / Decision-Makers
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22owner%22%20OR%20%22founder%22%20OR%20%22co-founder%22%20OR%20%22ceo%22%20OR%20%22managing%20director%22%20OR%20%22clinic%20manager%22)%20(%22{{Name}}%22%20OR%20%22&limit=1&related_keywords=true
```

---

### Founder Name
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22founder%22%20OR%20%22co-founder%22%20OR%20%22ceo%22)%20(%22{{1.company_name}}%22%20OR%20%22{%22)&limit=1&related_keywords=true
```

---

### Hiring Manager
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22hiring%20manager%22%20OR%20%22talent%20acquisition%20manager%22%20OR%20recruiter%20OR%20%22HR%20manager%22%20OR%20%22Talent%20Acquisition%20Specialist%22)%20(%22{{1.companyName}}%22%20OR%20%22{{1.companyUrl}}%22)&limit=1&related_keywords=true
```

---

### CISO, VP Security, or CTO
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22ciso%22%20OR%20%22vp%20security%22%20OR%20%22cto%22)%20(%22{{1.company_name}}%22)&limit=1&related_keywords=true
```

---

### Recruitment Fulfilment (Operations NOT HR)
```
https://google-search74.p.rapidapi.com/?query=site:linkedin.com/in/ ("founder" OR "co-founder" OR "ceo" OR "owner" OR "vp of construction" OR "project executive" OR "operations manager") "{{6.company}}"&limit=1&related_keywords=true
```

---

### VP Sales
```
https://google-search74.p.rapidapi.com/?query=site%3Alinkedin.com%2Fin%2F%20(%22vp%20sales%22%20OR%20%22vice%20president%20sales%22%20OR%20%22sales%20manager%22%20OR%20%22head%20of%20sales%22%20OR%20%22sales%20director%22)%20(%22{{ $json['Company Info']['Company Name'] }}%22%20OR%20%22{{ $json['Company Info']['Company Website'] }}%22)&limit=3&related_keywords=true
```
