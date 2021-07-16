// /opt/homebrew/bin/g++-10 -g graphics.cpp -o graphics -framework OpenGL /opt/homebrew/Cellar/glfw/3.3.4/lib/libglfw.3.3.dylib

/*
Half of this code is just boilerplate taken from https://www.glfw.org/documentation.
In other words, I didn't write all of the code here.
*/

#include </opt/homebrew/Cellar/glfw/3.3.4/include/GLFW/glfw3.h>
#include "./headers/linmath.h"
#include "./headers/random.h"
#include <stdlib.h>
#include <stdio.h>
#include <iostream>

#define SHOW_DEBUG_INFO true

float mouseX = 0;
float mouseY = 0;
int width, height;

static void mousePosChanged(GLFWwindow* window, double xpos, double ypos) {
    mouseX = (xpos / width) * 4 - 1;
    mouseY = (-ypos / height) * 4 + 1;
}

int main(void) {
    GLFWwindow* window;
    if (!glfwInit()) return -1;
    window = glfwCreateWindow(640, 480, "Title", NULL, NULL);
    if (!window) {
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);

    // Mouse move callback
    glfwSetCursorPosCallback(window, mousePosChanged);

    #if (SHOW_DEBUG_INFO == true)
        double previousTime = glfwGetTime();
        int frameCount = 0;
    #endif

    // Loop until the user closes the window
    while (!glfwWindowShouldClose(window)) {
        glfwGetFramebufferSize(window, &width, &height);
        glViewport(0, 0, width, height);
        glClear(GL_COLOR_BUFFER_BIT);

        // Measure framerate
        #if (SHOW_DEBUG_INFO == true)
            double currentTime = glfwGetTime();
            frameCount++;
            if ( currentTime - previousTime >= 1.0 ) {
                std::cout << "\033c" << frameCount << "\033[0;100f" << std::flush << " ";
                frameCount = 0;
                previousTime = currentTime;
            }
        #endif

        // Drawing!
        glBegin(GL_POLYGON);
            for (float i = 0; i <= 6.4; i += 0.3) {
                glVertex2f(cos(i) * 300 / width + mouseX, sin(i) * 300 / height + mouseY);
            }
        glEnd();

        // Swap front and back buffers
        glfwSwapBuffers(window);
        // Poll for and process events
        glfwPollEvents();
    }

    glfwDestroyWindow(window);
    glfwTerminate();
}