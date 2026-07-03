<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

header('Content-Type: application/json');

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);

switch ($path) {
    case '/health':
        http_response_code(200);
        echo json_encode([
            'status' => 'ok',
            'service' => 'worktree-manager-api',
            'time' => date('c'),
        ]);
        break;

    case '/api/worktrees':
        $worktrees = [
            [
                'id' => 'main',
                'branch' => 'main',
                'path' => '/repo',
                'lastCommit' => 'abc123',
            ],
            [
                'id' => 'feature-1',
                'branch' => 'feature/one',
                'path' => '/repo/.worktrees/feature-1',
                'lastCommit' => 'def456',
            ],
        ];
        http_response_code(200);
        echo json_encode(['worktrees' => $worktrees]);
        break;

    case '/api/branches':
        $branches = ['main', 'feature/one', 'feature/two'];
        http_response_code(200);
        echo json_encode(['branches' => $branches]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
        break;
}
