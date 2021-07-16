//Had a lot of trouble with shuffle

#include <iostream>
#include<vector>
#include <list>
#include <cstdlib>
#include <math.h>

#define PI 3.141592653589793238463
#define N

#define epsilon 0.1
#define epoch 2000

using namespace std;
// Just for GNU Plot issues
extern "C" FILE *popen(const char *command, const char *mode);

// Defining activation functions
//double sigmoid(double x) { return 1.0f / (1.0f + exp(-x)); }
//double dsigmoid(double x) { return x * (1.0f - x); }
double tanh(double x) { return (exp(x)-exp(-x))/(exp(x)+exp(-x)) ;}
double dtanh(double x) {return 1.0f - x*x ;}

double lin(double x) { return x;}
double dlin(double x) { return 1.0f;}

double init_weight() { return (2*rand()/RAND_MAX -1); }
double MAXX = -9999999999999999; //maximum value of input example

// Network Configuration
static const int numInputs = 1;
static const int numHiddenNodes = 7;
static const int numOutputs = 1;

// Learning Rate
const double lr = 0.05f;

double hiddenLayer[numHiddenNodes];
double outputLayer[numOutputs];

double hiddenLayerBias[numHiddenNodes];
double outputLayerBias[numOutputs];

double hiddenWeights[numInputs][numHiddenNodes];
double outputWeights[numHiddenNodes][numOutputs];

static const int numTrainingSets = 50;
double training_inputs[numTrainingSets][numInputs];
double training_outputs[numTrainingSets][numOutputs];

// Shuffling the data with each epoch
void shuffle(int *array, size_t n)
{
    if (n > 1) {
        size_t i;
        for (i = 0; i < n - 1; i++) {
            size_t j = i + rand() / (RAND_MAX / (n - i) + 1);
            int t = array[j];
            array[j] = array[i];
            array[i] = t;
        }
    }
}

// Forward Propagation. Only used after training is done.
void predict(double test_sample[])
{
    for (int j=0; j<numHiddenNodes; j++) {
        double activation=hiddenLayerBias[j];
        for (int k=0; k<numInputs; k++)
        {
            activation+=test_sample[k]*hiddenWeights[k][j];
        }
        hiddenLayer[j] = tanh(activation);
    }

    for (int j=0; j<numOutputs; j++) {
        double activation=outputLayerBias[j];
        for (int k=0; k<numHiddenNodes; k++)
        {
            activation+=hiddenLayer[k]*outputWeights[k][j];
        }
        outputLayer[j] = lin(activation);
    }
}

int main(int argc, const char * argv[]) {
    ///TRAINING DATA GENERATION
    for (int i = 0; i < numTrainingSets; i++) {
        double p = (2*PI*(double)i/numTrainingSets);
        training_inputs[i][0] = (p);
        training_outputs[i][0] = sin(p);

        ///FINDING NORMALIZING FACTOR
        for(int m=0; m<numInputs; ++m)
            if(MAXX < training_inputs[i][m])
                MAXX = training_inputs[i][m];
        for(int m=0; m<numOutputs; ++m)
            if(MAXX < training_outputs[i][m])
                MAXX = training_outputs[i][m];
    }

    ///NORMALIZING
    for (int i = 0; i < numTrainingSets; i++) {
        for(int m=0; m<numInputs; ++m)
            training_inputs[i][m] /= 1.0f*MAXX;

        for(int m=0; m<numOutputs; ++m)
            training_outputs[i][m] /= 1.0f*MAXX;

        cout<<"In: "<<training_inputs[i][0]<<"  out: "<<training_outputs[i][0]<<endl;
    }
    ///WEIGHT & BIAS INITIALIZATION
    for (int i=0; i<numInputs; i++) {
        for (int j=0; j<numHiddenNodes; j++) {
            hiddenWeights[i][j] = init_weight();
        }
    }
    for (int i=0; i<numHiddenNodes; i++) {
        hiddenLayerBias[i] = init_weight();
        for (int j=0; j<numOutputs; j++) {
            outputWeights[i][j] = init_weight();
        }
    }
    for (int i=0; i<numOutputs; i++) {
        //outputLayerBias[i] = init_weight();
        outputLayerBias[i] = 0;
    }

    ///FOR INDEX SHUFFLING
    int trainingSetOrder[numTrainingSets];
    for(int j=0; j<numInputs; ++j)
        trainingSetOrder[j] = j;


    ///TRAINING
    //std::cout<<"start train\n";
    vector<double> performance, epo; ///STORE MSE, EPOCH
    for (int n=0; n < epoch; n++) {
        double MSE = 0;
        shuffle(trainingSetOrder,numTrainingSets);
        std::cout<<"epoch :"<<n<<"\n";
        for (int i=0; i<numTrainingSets; i++)
        {
            //int i = trainingSetOrder[x];
            int x=i;
            //std::cout<<"Training Set :"<<x<<"\n";
            /// Forward pass
            for (int j=0; j<numHiddenNodes; j++)
            {
                double activation=hiddenLayerBias[j];
                //std::cout<<"Training Set :"<<x<<"\n";
                 for (int k=0; k<numInputs; k++) {
                    activation+=training_inputs[x][k]*hiddenWeights[k][j];
                }
                hiddenLayer[j] = tanh(activation);
            }

            for (int j=0; j<numOutputs; j++) {
                double activation=outputLayerBias[j];
                for (int k=0; k<numHiddenNodes; k++)
                {
                    activation+=hiddenLayer[k]*outputWeights[k][j];
                }
                outputLayer[j] = lin(activation);
            }

            //std::cout << "Input:" << training_inputs[x][0] << " " << "    Output:" << outputLayer[0] << "    Expected Output: " << training_outputs[x][0] << "\n";
            for(int k=0; k<numOutputs; ++k)
                MSE += (1.0f/numOutputs)*pow( training_outputs[x][k] - outputLayer[k], 2);

           /// Backprop
           ///   For V
            double deltaOutput[numOutputs];
            for (int j=0; j<numOutputs; j++) {
                double errorOutput = (training_outputs[i][j]-outputLayer[j]);
                deltaOutput[j] = errorOutput*dlin(outputLayer[j]);
            }

            ///   For W
            double deltaHidden[numHiddenNodes];
            for (int j=0; j<numHiddenNodes; j++) {
                double errorHidden = 0.0f;
                for(int k=0; k<numOutputs; k++) {
                    errorHidden+=deltaOutput[k]*outputWeights[j][k];
                }
                deltaHidden[j] = errorHidden*dtanh(hiddenLayer[j]);
            }

            ///Updation
            ///   For V and b
            for (int j=0; j<numOutputs; j++) {
                //b
                outputLayerBias[j] += deltaOutput[j]*lr;
                for (int k=0; k<numHiddenNodes; k++)
                {
                    outputWeights[k][j]+= hiddenLayer[k]*deltaOutput[j]*lr;
                }
            }

            ///   For W and c
            for (int j=0; j<numHiddenNodes; j++) {
                //c
                hiddenLayerBias[j] += deltaHidden[j]*lr;
                //W
                for(int k=0; k<numInputs; k++) {
                  hiddenWeights[k][j]+=training_inputs[i][k]*deltaHidden[j]*lr;
                }
            }
        }
        //Averaging the MSE
        MSE /= 1.0f*numTrainingSets;
        //cout<< "  MSE: "<< MSE<<endl;
        ///Steps to PLOT PERFORMANCE PER EPOCH
        performance.push_back(MSE*100);
        epo.push_back(n);
    }

    // Print weights
    std::cout << "Final Hidden Weights\n[ ";
    for (int j=0; j<numHiddenNodes; j++) {
        std::cout << "[ ";
        for(int k=0; k<numInputs; k++) {
            std::cout << hiddenWeights[k][j] << " ";
        }
        std::cout << "] ";
    }
    std::cout << "]\n";

    std::cout << "Final Hidden Biases\n[ ";
    for (int j=0; j<numHiddenNodes; j++) {
        std::cout << hiddenLayerBias[j] << " ";

    }
    std::cout << "]\n";
    std::cout << "Final Output Weights";
    for (int j=0; j<numOutputs; j++) {
        std::cout << "[ ";
        for (int k=0; k<numHiddenNodes; k++) {
            std::cout << outputWeights[k][j] << " ";
        }
        std::cout << "]\n";
    }
    std::cout << "Final Output Biases\n[ ";
    for (int j=0; j<numOutputs; j++) {
        std::cout << outputLayerBias[j] << " ";
    }
    std::cout << "]\n";

    return 0;
}