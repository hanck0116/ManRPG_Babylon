# Rules Implementation Status

## 구현됨

- 타이틀, 캐릭터 생성, 시트 확인, 전투, 심상세계, 게임오버 상태
- 6스탯 구조와 `appearance` 통일
- `maxHp`, `maxMp`, `mpRegen`, `basicAttackDamage`, `multiCastingCount` 공식
- 층 클리어 시 `level +5`, `statPoints +15`, `coins +1`, `rewardDrawTicketCount +1`
- 마법 준비 후 발동 구조와 prepared spell 슬롯
- 스킬 슬롯, 만다라 플래그, 8th/9th 만다라 요구 구조
- 보상 뽑기권, 리롤, 금지 보상 제거
- 외공서, 내공서, 검기, 멀티케스팅의 서, 일반 마법서, 마도서 사용
- 심상세계 3D 섬과 보상 장치, 저장고, 만트라 석상, 상점, 연습실, 게이트 상호작용
- localStorage 저장/불러오기 및 버전 마이그레이션
- GLB 모델 로더와 fallback 도형

## 임시 처리

- 실제 GLB 파일은 포함하지 않고 로더와 fallback 구조만 제공한다.
- 스킬 자동 생성은 만트라 기반 템플릿으로 생성한다.
- 보스 전용 패턴은 적 역할/맵 회전 구조만 준비했다.
- 마법 효과는 고정 데이터의 type에 따른 범용 효과로 처리한다.
