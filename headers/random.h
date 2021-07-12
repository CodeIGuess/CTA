#ifndef RANDOM_H
#define RANDOM_H

#define RANDOM_H_FUNC static inline

#include <stdlib.h>

double randf() { return rand() / (RAND_MAX + 1.); }

#endif