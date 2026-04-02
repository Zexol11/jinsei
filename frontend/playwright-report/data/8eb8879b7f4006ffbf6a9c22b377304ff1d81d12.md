# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - generic [ref=e13]:
      - paragraph [ref=e14]: microjournal
      - paragraph [ref=e15]: The Digital Vellum
    - generic [ref=e16]:
      - heading "Welcome back" [level=1] [ref=e17]
      - paragraph [ref=e18]: Sign in to continue writing.
      - generic [ref=e19]:
        - generic [ref=e20]:
          - generic [ref=e21]: Email
          - textbox "Email" [ref=e22]:
            - /placeholder: you@example.com
        - generic [ref=e23]:
          - generic [ref=e24]: Password
          - generic [ref=e25]:
            - textbox "Password" [ref=e26]:
              - /placeholder: ••••••••
            - button [ref=e27]:
              - img [ref=e28]
        - button "Sign in" [ref=e31] [cursor=pointer]
    - paragraph [ref=e32]:
      - text: No account?
      - link "Create one" [ref=e33] [cursor=pointer]:
        - /url: /register
```