const { chromium } = require('playwright');

let browser;
let page;

jest.setTimeout(20000); // set the timeout to 10 seconds

beforeAll(async () => {
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser.close();
});

beforeEach(async () => {
  page = await browser.newPage();
  await page.goto('http://localhost:3000/');
});

afterEach(async () => {
  await page.close();
});

describe('Login', () => {
  it('should display the "Login" button', async () => {
    try {
      await page.waitForSelector('#login-button', { timeout: 18000 });
    } catch (error) {
      throw new Error('Login button not found');
    }
  }, 10000);

  it('should display the username input field', async () => {
    try {
      await page.waitForSelector('#email', { timeout: 18000 });
    } catch (error) {
      throw new Error('Username input field not found');
    }
  }, 10000); // timeout of 20 seconds

  it('should display the password input field', async () => {
    try {
      await page.waitForSelector('#password', { timeout: 18000 });
    } catch (error) {
      throw new Error('Password input field not found');
    }
  }, 10000); // timeout of 20 seconds

  it('should display the "Register" link', async () => {
    try {
      await page.waitForSelector('a.link-tag-dark, a.link-tag-light', { timeout: 18000 });
    } catch (error) {
      throw new Error('"Register" link not found');
    }
  }, 10000); // timeout of 20 seconds
});


describe('Login functionality', () => {
  it('should allow input in username field', async () => {
    await page.waitForSelector('#email', { timeout: 18000 });
    await page.type('#email', 'test_user');
    const inputValue = await page.$eval('#email', el => el.value);
    expect(inputValue).toBe('test_user');
  }, 10000);

  it('should allow input in password field', async () => {
    await page.waitForSelector('#password', { timeout: 18000 });
    await page.type('#password', 'test_password');
    const inputValue = await page.$eval('#password', el => el.value);
    expect(inputValue).toBe('test_password');
  }, 10000);

  it('should navigate to "/decks" if login is successful', async () => {
    // Mock the successful login request
    await page.route('http://localhost:3002/login', (route, request) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ error: false, message: "Logged in", token: "token" }),
      });
    });

    await page.type('#email', 'test_user');
    await page.type('#password', 'test_password');
    await page.click('#login-button');
    await page.waitForNavigation();
    expect(page.url()).toContain('/decks');
  }, 10000);

  // it('should display a toast message when login is successful', async () => {
  //   // Mock the successful login request
  //   await page.route('http://localhost:3002/login', (route, request) => {
  //     route.fulfill({
  //       status: 200,
  //       body: JSON.stringify({ error: false, message: "Logged in", token: "token" }),
  //     });
  //   });

  //   await page.type('#email', 'test_user');
  //   await page.type('#password', 'test_password');
  //   await page.click('#login-button');
  //   // Wait for the toast container
  //   const toastContainer = await page.waitForSelector('.Toastify__toast-container', { visible: true });
  //   expect(toastContainer).toBeTruthy();
  // }, 10000);

  it('should navigate back to "/login" if login fails', async () => {
    // Mock the failed login request
    await page.route('http://localhost:3002/login', (route, request) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ error: true, message: "Failed to login" }),
      });
    });

    await page.type('#email', 'test_user');
    await page.type('#password', 'test_password');
    await page.click('#login-button');
    await page.waitForNavigation();
    expect(page.url()).toContain('/login');
  }, 10000);

  // it('should display a toast message when login fails', async () => {
  //   // Mock the failed login request
  //   await page.route('http://localhost:3002/login', (route, request) => {
  //     route.fulfill({
  //       status: 200,
  //       body: JSON.stringify({ error: true, message: "Failed to login" }),
  //     });
  //   });

  //   await page.type('#email', 'wrong_user');
  //   await page.type('#password', 'wrong_password');
  //   await page.click('#login-button');
  //   // Wait for the toast container
  //   const toastContainer = await page.waitForSelector('.Toastify__toast-container', { visible: true });
  //   expect(toastContainer).toBeTruthy();
  // }, 10000);
  
});