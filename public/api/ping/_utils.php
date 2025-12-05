<?php

/**
 * Generates a new key and time window for the next ping.
 * Returns [key, minTs, maxTs]
 */
function generateNextRefreshWindow(): array {
    $now = time();

    // How many seconds until the window starts (5–30 sec from now)
    $delayMin = 5;
    $delayMax = 30;
    $delay = rand($delayMin, $delayMax);

    $minTs = $now + $delay;

    // Window width 5–10 seconds
    $windowWidth = rand(5, 10);
    $maxTs = $minTs + $windowWidth;

    $key = generateGUIDv4();

    return [$key, $minTs, $maxTs];
}
