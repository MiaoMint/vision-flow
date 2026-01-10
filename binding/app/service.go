package app

type Service struct {
	WailsJSON string
}

func NewService(wailsJSON string) *Service {
	return &Service{
		WailsJSON: wailsJSON,
	}
}

func (s *Service) GetWailsJSON() string {
	return s.WailsJSON
}
