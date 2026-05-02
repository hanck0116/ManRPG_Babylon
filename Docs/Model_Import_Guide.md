# Model Import Guide

이 프로젝트는 모델 파일이 없어도 fallback 도형으로 실행된다. 모델은 시각 표현만 담당하고 전투 판정은 기존 root/collider가 유지한다.

## 폴더

- `assets/models/player/player.glb`
- `assets/models/enemies/default_enemy.glb`
- `assets/models/innerworld/reward_device.glb`
- `assets/models/innerworld/storage.glb`
- `assets/models/innerworld/mantra_statue.glb`
- `assets/models/innerworld/shop.glb`
- `assets/models/innerworld/training_room.glb`
- `assets/models/innerworld/next_gate.glb`
- `assets/models/fallback/fallback.glb`

## 규칙

- glb 원점은 판정용 root와 맞춘다.
- 모델에 충돌 판정을 의존하지 않는다.
- 모바일 브라우저를 위해 텍스처와 폴리곤 수를 낮게 유지한다.
- 로딩 실패 시 게임은 fallback 캡슐/박스/원통으로 계속 진행된다.
