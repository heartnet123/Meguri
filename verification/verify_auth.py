from playwright.sync_api import Page, expect, sync_playwright

def test_auth_pages(page: Page):
  # 1. Login Page
  page.goto("http://localhost:3000/login")
  expect(page.get_by_role("heading", name="Welcome back")).to_be_visible()
  page.screenshot(path="verification/login.png")

  # 2. Register Page
  page.goto("http://localhost:3000/register")
  expect(page.get_by_role("heading", name="Create an account")).to_be_visible()
  page.screenshot(path="verification/register.png")

  # 3. Join Workspace Page
  page.goto("http://localhost:3000/join-workspace?id=test&token=test")
  expect(page.get_by_role("heading", name="Join Workspace")).to_be_visible()
  page.screenshot(path="verification/join-workspace.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      test_auth_pages(page)
    finally:
      browser.close()