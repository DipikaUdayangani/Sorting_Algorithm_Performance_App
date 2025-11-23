import javafx.application.Application;
import javafx.stage.Stage;

/**
 * Main application class. Handles the GUI startup (Member 2's focus).
 */
public class Main extends Application {

    public static void main(String[] args) {
        launch(args);
    }

    @Override
    public void start(Stage primaryStage) {
        // GUI setup will be added by Member 2
        primaryStage.setTitle("SORTSWIFT - Sorting Algorithm Performance Evaluator");
        // For now, just show an empty stage
        primaryStage.show();
    }
}