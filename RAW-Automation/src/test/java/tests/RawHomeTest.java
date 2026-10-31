package tests;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;

import static org.junit.jupiter.api.Assertions.assertTrue;

class RawHomeTest {

    @Test
    void openRawHomepage() {

        WebDriver driver = new ChromeDriver();

        try {
            driver.get("http://localhost:5173");

            String pageTitle = driver.getTitle();

            System.out.println("RAW Page Title: " + pageTitle);

            assertTrue(
                    pageTitle != null && !pageTitle.isBlank(),
                    "RAW homepage should have a page title");

        } finally {
            driver.quit();
        }
    }
}
